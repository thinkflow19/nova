import os
import json
import logging
import asyncio
from typing import Dict, List, Any, Optional, AsyncGenerator, TypedDict, Union, Sequence, Annotated, Literal
from datetime import datetime
from uuid import UUID
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from operator import add

from fastapi import HTTPException
from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langgraph.types import StreamWriter

from enum import Enum
from app.services.database_service import DatabaseService
from app.services.dependencies import get_database_service
from app.models.chat import ChatMessage, ChatSession, ChatMessageCreate, ChatSessionCreate, ChatSessionUpdate, ChatCompletionRequest
from app.config.settings import settings
from app.services.vector_store_service import VectorStoreService, get_vector_store_service
from app.config.prompts import (
    SYSTEM_PROMPT_BASE,
    SYSTEM_PROMPT_WITH_CONTEXT,
    SYSTEM_PROMPT_NO_CONTEXT,
    ERROR_MESSAGES,
    DEFAULT_RESPONSES
)

# Configure logging
logger = logging.getLogger(__name__)

# Environment Variables
OPENAI_API_KEY = settings.OPENAI_API_KEY
DEFAULT_CHAT_MODEL = settings.OPENAI_CHAT_MODEL
DEFAULT_EMBEDDING_MODEL = settings.EMBEDDING_MODEL
STREAMING_ENABLED = getattr(settings, "STREAMING_ENABLED", os.getenv("STREAMING_ENABLED", "True").lower() == "true")
PINECONE_API_KEY = settings.PINECONE_API_KEY
PINECONE_ENVIRONMENT = settings.PINECONE_ENVIRONMENT
VECTOR_SEARCH_TOP_K = int(getattr(settings, "VECTOR_SEARCH_TOP_K", os.getenv("VECTOR_SEARCH_TOP_K", "5")))

# Role Enum
class Role(Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    TOOL = "tool"

# State for Graph
class GraphState(TypedDict):
    messages: Annotated[List[BaseMessage], add]  # Use add reducer for message history
    session_id: str
    project_id: str
    retrieved_context: Optional[str]
    assistant_response: Optional[str]
    error: Optional[str]

class ConfigSchema(TypedDict):
    checkpoint_id: str
    thread_id: str
    stream_mode: Literal["values", "updates", "custom", "messages", "debug"]
    debug: bool
    temperature: float

class ChatService:
    """Service for handling chat completions and LLM interactions using LangGraph."""

    def __init__(self):
        """Initialize the chat service with LLM, embeddings, and vector store."""
        if not OPENAI_API_KEY:
            logger.error("OPENAI_API_KEY is not set.")
        if not PINECONE_API_KEY:
            logger.error("PINECONE_API_KEY is not set.")
        if not PINECONE_ENVIRONMENT:
            logger.error("PINECONE_ENVIRONMENT is not set.")

        self.embeddings_model = OpenAIEmbeddings(model=DEFAULT_EMBEDDING_MODEL, api_key=OPENAI_API_KEY)
        self.llm = ChatOpenAI(
            model=DEFAULT_CHAT_MODEL, 
            temperature=0.7,
            streaming=STREAMING_ENABLED,  # Use the setting from environment
            api_key=OPENAI_API_KEY,
            max_retries=3
        )
        
        # Initialize services
        self.db_service = DatabaseService()
        try:
            self.vector_service = get_vector_store_service()
        except Exception as e:
            logger.error(f"Failed to initialize VectorStoreService: {e}", exc_info=True)
            self.vector_service = None

        logger.info(f"Chat service initialized. Streaming: {STREAMING_ENABLED}, Model: {DEFAULT_CHAT_MODEL}")
        self._compile_graph()

    def _compile_graph(self):
        """Compile the LangGraph workflow."""
        workflow = StateGraph(GraphState)

        # Add nodes with proper metadata and retry policies
        workflow.add_node(
            "retrieve_context",
            self._retrieve_context_node,
            metadata={
                "description": "Retrieves relevant context from vector store",
                "input_schema": GraphState,
                "output_schema": Dict[str, Any]
            }
        )

        workflow.add_node(
            "generate_response",
            self._generate_response_node,
            metadata={
                "description": "Generates AI response using context and history",
                "input_schema": GraphState,
                "output_schema": Dict[str, Any]
            }
        )

        # Define flow between nodes
        workflow.set_entry_point("retrieve_context")
        workflow.add_edge("retrieve_context", "generate_response")
        workflow.add_edge("generate_response", END)

        # Compile with checkpointing
        checkpointer = MemorySaver()
        self.app = workflow.compile(
            checkpointer=checkpointer,
            debug=True
        )

        logger.info("LangGraph workflow compiled successfully")

    async def _retrieve_context_node(self, state: GraphState, config: RunnableConfig, writer: Optional[StreamWriter] = None) -> Dict[str, Any]:
        """Retrieves context using the vector service."""
        logger.info(f"Node: Retrieving context for session {state['session_id']}, project {state['project_id']}")
        
        try:
            if writer:
                writer({"node": "retrieve_context", "status": "started"})

            if not self.vector_service:
                logger.warning("Vector service not initialized, skipping context retrieval.")
                return {"retrieved_context": None, "error": "Vector service not initialized"}

            last_message = state["messages"][-1]
            if not isinstance(last_message, HumanMessage) or not last_message.content:
                logger.warning("Last message is not a valid HumanMessage with content, skipping retrieval.")
                return {"retrieved_context": None, "error": "Invalid message format"}

            query_text = last_message.content
            query_embedding = await self.embeddings_model.aembed_query(query_text)
            
            namespace = f"proj_{state['project_id']}"
            query_filter = {"project_id": str(state['project_id'])}
            
            search_results = await self.vector_service.search_by_embedding(
                embedding=query_embedding,
                top_k=VECTOR_SEARCH_TOP_K,
                namespace=namespace,
                filter=query_filter
            )

            if not search_results:
                return {"retrieved_context": None}

            # Filter and format results
            filtered_results = [
                result for result in search_results 
                if result.get("score", 0) > 0.7
            ]
            
            if not filtered_results:
                filtered_results = search_results[:2] if search_results else []
            
            context_chunks = []
            for result in filtered_results:
                text = result.get("text", "").strip()
                if text:
                    source_info = f"Source: {result.get('file_name', 'Unknown')}"
                    formatted_chunk = f"{text}\n({source_info})"
                    context_chunks.append(formatted_chunk)
            
            context_str = "\n---\n".join(context_chunks) if context_chunks else None
            
            if writer:
                writer({
                    "node": "retrieve_context",
                    "status": "completed",
                    "context_length": len(context_str) if context_str else 0
                })

            return {"retrieved_context": context_str}

        except Exception as e:
            logger.error(f"Error in context retrieval: {e}", exc_info=True)
            if writer:
                writer({
                    "node": "retrieve_context",
                    "status": "error",
                    "error": str(e)
                })
            return {"retrieved_context": None, "error": str(e)}

    async def _generate_response_node(self, state: GraphState, config: RunnableConfig, writer: Optional[StreamWriter] = None) -> Dict[str, Any]:
        """Generates response using LLM based on history and context."""
        logger.info(f"Node: Generating response for session {state['session_id']}")
        
        try:
            if writer:
                writer({"node": "generate_response", "status": "started"})

            messages = state["messages"]
            context = state.get("retrieved_context")
            temperature = config.get("configurable", {}).get("temperature", 0.7)

            # Create system prompt based on context availability
            if context:
                system_content = SYSTEM_PROMPT_WITH_CONTEXT.format(base_prompt=SYSTEM_PROMPT_BASE)
            else:
                system_content = SYSTEM_PROMPT_NO_CONTEXT.format(base_prompt=SYSTEM_PROMPT_BASE)

            # Build prompt
            prompt_messages = [SystemMessage(content=system_content)]
            if context:
                prompt_messages.append(SystemMessage(content=f"Relevant Context:\n---\n{context}\n---"))
            prompt_messages.append(MessagesPlaceholder(variable_name="history"))

            # Create and execute chain
            prompt_template = ChatPromptTemplate.from_messages(prompt_messages)
            history_for_chain = [msg for msg in messages if not isinstance(msg, SystemMessage)]
            
            # Configure LLM with temperature from config
            llm = self.llm.with_config({"temperature": temperature})
            chain = prompt_template | llm | StrOutputParser()
            
            response = await chain.ainvoke({"history": history_for_chain})
            
            if not response or not response.strip():
                response = DEFAULT_RESPONSES["greeting"]
            
            if writer:
                writer({
                    "node": "generate_response",
                    "status": "completed",
                    "response_length": len(response)
                })

            return {"assistant_response": response}

        except Exception as e:
            logger.error(f"Error in response generation: {e}", exc_info=True)
            if writer:
                writer({
                    "node": "generate_response",
                    "status": "error",
                    "error": str(e)
                })
            return {
                "assistant_response": ERROR_MESSAGES["general_error"],
                "error": str(e)
            }

    async def process_user_message(
        self,
        db_service: DatabaseService,
        session_id: str,
        user_id: str,
        user_message: str,
        stream_mode: Literal["values", "updates", "custom", "messages", "debug"] = "values",
        temperature: float = 0.7,
        debug: bool = False
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Process a user message and return the AI response or streaming response."""
        logger.info(f"Processing message for session {session_id}")
        
        try:
            # Get session and project info
            session = await db_service.get_chat_session(session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Chat session not found")
            
            project_id = session.get("project_id")
            
            # Store user message
            await db_service.create_chat_message(
                session_id=session_id,
                project_id=project_id,
                user_id=user_id,
                role=Role.USER.value,
                content=user_message
            )
            
            # Get message history
            messages_data = await db_service.list_chat_messages(session_id, limit=20)
            history = []
            
            for msg in messages_data:
                role = msg.get("role")
                content = msg.get("content", "")
                
                if role == Role.USER.value:
                    history.append(HumanMessage(content=content))
                elif role == Role.ASSISTANT.value:
                    history.append(AIMessage(content=content))
                elif role == Role.SYSTEM.value:
                    history.append(SystemMessage(content=content))
            
            # Ensure current message is included
            if not history or not (
                isinstance(history[-1], HumanMessage) and history[-1].content == user_message
            ):
                history.append(HumanMessage(content=user_message))
            
            # Initialize state
            state = {
                "messages": history,
                "session_id": session_id,
                "project_id": project_id,
                "retrieved_context": None,
                "assistant_response": None,
                "error": None
            }

            # Configure graph execution
            config = {
                "configurable": {
                    "checkpoint_id": f"session_{session_id}",
                    "thread_id": f"thread_{session_id}",
                    "stream_mode": stream_mode,
                    "debug": debug,
                    "temperature": temperature
                }
            }

            if STREAMING_ENABLED:
                return self._stream_response(db_service, session_id, user_id, state, config)
            else:
                return await self._generate_complete_response(db_service, session_id, user_id, state, config)
                
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=500, detail="Failed to process message")

    async def _generate_complete_response(
        self, 
        db_service: DatabaseService, 
        session_id: str, 
        user_id: str, 
        state: Dict,
        config: RunnableConfig
    ) -> str:
        """Generate a complete response (non-streaming)."""
        try:
            result = await self.app.ainvoke(state, config=config)
            response = result.get("assistant_response", "")
            error = result.get("error")
            
            if error:
                logger.error(f"Error in response generation: {error}")
            
            if response:
                project_id = state.get("project_id")
                await db_service.create_chat_message(
                    session_id=session_id,
                    project_id=project_id,
                    user_id=user_id,
                    role=Role.ASSISTANT.value,
                    content=response
                )
            
            return response

        except Exception as e:
            logger.error(f"Error in non-streaming response generation: {e}", exc_info=True)
            raise

    async def _stream_response(
        self, 
        db_service: DatabaseService, 
        session_id: str, 
        user_id: str, 
        state: Dict,
        config: RunnableConfig
    ) -> AsyncGenerator[str, None]:
        """Stream the response."""
        try:
            response_buffer = []
            stream_mode = config.get("configurable", {}).get("stream_mode", "values")
            
            async for event in self.app.astream_events(state, config=config):
                if stream_mode == "values":
                    # Handle values mode
                    if "assistant_response" in event:
                        content = event["assistant_response"]
                        if content:
                            response_buffer.append(content)
                            yield content
                elif stream_mode == "updates":
                    # Handle updates mode
                    node = event.get("node_name")
                    if node == "generate_response" and "content" in event:
                        content = event["content"]
                        if content:
                            response_buffer.append(content)
                            yield content
                elif stream_mode == "messages":
                    # Handle messages mode
                    if isinstance(event, tuple) and len(event) == 2:
                        message, metadata = event
                        if hasattr(message, "content"):
                            response_buffer.append(message.content)
                            yield message.content
                elif stream_mode == "debug":
                    # Handle debug mode
                    if "payload" in event:
                        payload = event["payload"]
                        if "result" in payload:
                            for key, value in payload["result"]:
                                if key == "assistant_response":
                                    response_buffer.append(value)
                                    yield value
            
            # Store complete response
            complete_response = "".join(response_buffer)
            if complete_response:
                project_id = state.get("project_id")
                await db_service.create_chat_message(
                    session_id=session_id,
                    project_id=project_id,
                    user_id=user_id,
                    role=Role.ASSISTANT.value,
                    content=complete_response
                )
            
        except Exception as e:
            logger.error(f"Error in streaming response: {e}", exc_info=True)
            error_msg = f"I'm sorry, I encountered an error while generating a response. Error: {str(e)}"
            yield error_msg
            
            try:
                project_id = state.get("project_id")
                await db_service.create_chat_message(
                    session_id=session_id,
                    project_id=project_id,
                    user_id=user_id,
                    role=Role.ASSISTANT.value,
                    content=error_msg
                )
            except Exception as db_error:
                logger.error(f"Failed to store error message: {db_error}")

# Singleton instance
_chat_service = None

def get_chat_service() -> ChatService:
    """Get the chat service singleton."""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
