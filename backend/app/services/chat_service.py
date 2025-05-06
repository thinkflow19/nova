import os
import json
import logging
import asyncio
from typing import Dict, List, Any, Optional, AsyncGenerator, TypedDict, Union, Sequence
from datetime import datetime
from uuid import UUID
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from fastapi import HTTPException
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from enum import Enum
from app.services.database_service import DatabaseService
from app.services.dependencies import get_database_service
from app.models.chat import ChatMessage, ChatSession, ChatMessageCreate, ChatSessionCreate, ChatSessionUpdate, ChatCompletionRequest
from app.config.settings import settings
from app.services.vector_store_service import VectorStoreService, get_vector_store_service

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
    messages: List[BaseMessage]
    session_id: str
    project_id: str
    retrieved_context: Optional[str]

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
            temperature=0, 
            streaming=STREAMING_ENABLED, 
            api_key=OPENAI_API_KEY,
            max_retries=3
        )
        
        # Ensure DatabaseService is initialized
        self.db_service = DatabaseService() 
        
        try:
            # Ensure VectorStoreService is initialized (uses embedding_service indirectly)
            self.vector_service = get_vector_store_service() 
        except Exception as e:
            logger.error(f"Failed to initialize VectorStoreService: {e}", exc_info=True)
            self.vector_service = None

        logger.info(f"Chat service initialized. Streaming: {STREAMING_ENABLED}, Model: {DEFAULT_CHAT_MODEL}")
        self._compile_graph()

    def _compile_graph(self):
        """Defines and compiles the LangGraph workflow."""
        workflow = StateGraph(GraphState)
        workflow.add_node("retrieve_context", self._retrieve_context_node)
        workflow.add_node("generate_response", self._generate_response_node)
        workflow.set_entry_point("retrieve_context")
        workflow.add_edge("retrieve_context", "generate_response")
        workflow.add_edge("generate_response", END)
        checkpointer = MemorySaver()
        self.app = workflow.compile(checkpointer=checkpointer)
        logger.info("LangGraph workflow compiled.")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((Exception))
    )
    async def _retrieve_context_node(self, state: GraphState) -> Dict[str, Any]:
        """Retrieves context using the vector service."""
        logger.info(f"Node: Retrieving context for session {state['session_id']}, project {state['project_id']}")
        
        project_id = state["project_id"]
        context_str = ""
        
        try:
            if not self.vector_service:
                logger.warning("Vector service not initialized, skipping context retrieval.")
                return {"retrieved_context": None}

            last_message = state["messages"][-1]
            if not isinstance(last_message, HumanMessage) or not last_message.content:
                logger.warning("Last message is not a valid HumanMessage with content, skipping retrieval.")
                return {"retrieved_context": None}

            query_text = last_message.content
            
            # Generate embedding for the query
            logger.info(f"Generating embedding for query: {query_text[:50]}...")
            query_embedding = await self.embeddings_model.aembed_query(query_text)
            logger.info(f"Generated embedding of dimension {len(query_embedding)}")

            # Define namespace pattern for project documents
            namespace = f"proj_{project_id}"
            logger.info(f"Searching in namespace: {namespace}")
            
            # Define the filter based on the project ID
            query_filter = {"project_id": str(project_id)}
            logger.debug(f"Querying vector store with filter: {query_filter}, top_k={VECTOR_SEARCH_TOP_K}")

            # Execute vector search
            search_results = await self.vector_service.search_by_embedding(
                embedding=query_embedding,
                top_k=VECTOR_SEARCH_TOP_K,
                namespace=namespace,
                filter=query_filter
            )

            if not search_results:
                logger.info("No relevant context found in vector store for this project.")
                return {"retrieved_context": None}

            # Filter out low-relevance results
            # Generally cosine similarity scores > 0.7 are considered good matches
            filtered_results = [
                result for result in search_results 
                if result.get("score", 0) > 0.7
            ]
            
            if not filtered_results:
                logger.info("No high-relevance context found in vector store.")
                # Use fewer results if no high-relevance matches
                filtered_results = search_results[:2] if search_results else []
            
            # Extract text chunks from results
            context_chunks = []
            for result in filtered_results:
                text = result.get("text", "").strip()
                if text:
                    # Add metadata about source
                    source_info = f"Source: {result.get('file_name', 'Unknown')}"
                    formatted_chunk = f"{text}\n({source_info})"
                    context_chunks.append(formatted_chunk)
            
            if context_chunks:
                context_str = "\n---\n".join(context_chunks)
                logger.info(
                    f"Retrieved {len(context_chunks)} relevant chunks from project {project_id}. "
                    f"First chunk: {context_chunks[0][:100]}..."
                )
            else:
                logger.info("No usable text found in search results.")

        except Exception as e:
            logger.error(f"Error in _retrieve_context_node: {e}", exc_info=True)
            # Handle gracefully - continue without context
            return {"retrieved_context": None}

        return {"retrieved_context": context_str if context_str else None}

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((Exception))
    )
    async def _generate_response_node(self, state: GraphState) -> Dict[str, Any]:
        """Generates response using LLM based on history and context."""
        logger.info(f"Node: Generating response for session {state['session_id']}")
        messages = state["messages"]
        context = state.get("retrieved_context")

        logger.info(f"Number of messages in history: {len(messages)}")
        logger.info(f"Context available: {bool(context)}")

        # Create a more detailed system prompt based on whether context is available
        system_content = """You are a helpful AI assistant. Respond to the user's query based on the conversation history."""
        
        if context:
            system_content += """ 
            I'm providing you with relevant information retrieved from the user's documents. 
            Use this information to inform your answer. When you use information from the provided context:
            1. Cite the specific source when referring to information from the context
            2. Synthesize information from multiple sources if available
            3. Still use your existing knowledge for general information
            
            If the context doesn't seem relevant to the query, rely on your general knowledge instead.
            """
        else:
            system_content += """
            I don't have specific documents to reference for this query, so please use your general knowledge to answer.
            If the user is asking about specific documents they've uploaded, let them know you couldn't find relevant information
            and suggest they rephrase their question or upload additional documents if needed.
            """

        prompt_messages = [
            SystemMessage(content=system_content)
        ]
        
        if context:
            prompt_messages.append(SystemMessage(content=f"Relevant Context:\n---\n{context}\n---"))
            
        prompt_messages.append(MessagesPlaceholder(variable_name="history"))

        prompt_template = ChatPromptTemplate.from_messages(prompt_messages)
        
        # Filter out system messages for the history
        history_for_chain = [msg for msg in messages if not isinstance(msg, SystemMessage)]
        chain_input = {"history": history_for_chain}

        logger.info(f"Preparing to generate with {len(history_for_chain)} messages in history")
        logger.debug(f"Last message content: {history_for_chain[-1].content if history_for_chain else 'No messages'}")
        
        try:
            chain = prompt_template | self.llm | StrOutputParser()
            response = await chain.ainvoke(chain_input)
            
            # Store the assistant's response in the chat history
            return {"assistant_response": response}
        except Exception as e:
            logger.error(f"Error in response generation: {str(e)}", exc_info=True)
            error_response = "I'm sorry, I encountered an error generating a response. Please try again."
            return {"assistant_response": error_response}

    async def process_user_message(
        self,
        db_service: DatabaseService,
        session_id: str,
        user_id: str,
        user_message: str,
    ) -> Union[str, AsyncGenerator[str, None]]:
        """Process a user message and return the AI response or streaming response."""
        logger.info(f"Processing message for session {session_id}")
        
        try:
            # 1. Fetch the session to get project ID
            session = await db_service.get_chat_session(session_id)
            if not session:
                logger.error(f"Session {session_id} not found")
                raise HTTPException(status_code=404, detail="Chat session not found")
            
            project_id = session.get("project_id")
            
            # 2. Store the user message
            await db_service.create_chat_message(
                session_id=session_id,
                user_id=user_id,
                role=Role.USER.value,
                content=user_message
            )
            
            # 3. Get the existing messages for this session, limited to recent history
            messages_data = await db_service.get_chat_messages(session_id, limit=20)
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
            
            # Ensure the current user message is included if not already in history
            # (in case DB operations are slow/async and message isn't returned in the previous query)
            if not history or not (
                isinstance(history[-1], HumanMessage) and history[-1].content == user_message
            ):
                history.append(HumanMessage(content=user_message))
            
            # Initialize state for LangGraph
            state = {
                "messages": history,
                "session_id": session_id,
                "project_id": project_id,
                "retrieved_context": None,
            }
            
            if STREAMING_ENABLED:
                return self._stream_response(db_service, session_id, user_id, state)
            else:
                return await self._generate_complete_response(db_service, session_id, user_id, state)
                
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            if isinstance(e, HTTPException):
                raise
            raise HTTPException(status_code=500, detail="Failed to process message")

    async def _generate_complete_response(
        self, db_service: DatabaseService, session_id: str, user_id: str, state: Dict
    ) -> str:
        """Generate a complete response (non-streaming)."""
        try:
            # Execute the graph
            result = await self.app.ainvoke(state)
            response = result.get("assistant_response", "")
            
            # Store the AI response
            if response:
                await db_service.create_chat_message(
                    session_id=session_id,
                    user_id=user_id,
                    role=Role.ASSISTANT.value,
                    content=response
                )
                
            return response
        except Exception as e:
            logger.error(f"Error in non-streaming response generation: {str(e)}", exc_info=True)
            raise

    async def _stream_response(
        self, db_service: DatabaseService, session_id: str, user_id: str, state: Dict
    ) -> AsyncGenerator[str, None]:
        """Stream the response."""
        try:
            response_buffer = []
            
            async for event in self.app.astream_events(state, version_id=f"session_{session_id}"):
                node = event["event"].get("node_name")
                
                if node == "retrieve_context":
                    # Context retrieved, don't yield anything yet
                    yield ""  # Empty chunk to keep connection alive
                elif node == "generate_response":
                    content = event["content"] if "content" in event else ""
                    if content:
                        response_buffer.append(content)
                        yield content
            
            # Store complete response in database
            complete_response = "".join(response_buffer)
            if complete_response:
                await db_service.create_chat_message(
                    session_id=session_id,
                    user_id=user_id,
                    role=Role.ASSISTANT.value,
                    content=complete_response
                )
                
        except Exception as e:
            logger.error(f"Error in streaming response: {str(e)}", exc_info=True)
            yield f"I'm sorry, I encountered an error while generating a response. Error: {str(e)}"
            # Store error response
            try:
                await db_service.create_chat_message(
                    session_id=session_id,
                    user_id=user_id,
                    role=Role.ASSISTANT.value,
                    content=f"Error generating response: {str(e)}"
                )
            except Exception as db_error:
                logger.error(f"Failed to store error message: {str(db_error)}")

# Singleton instance
_chat_service = None

# Dependency for FastAPI
def get_chat_service() -> ChatService:
    """Get the chat service singleton."""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service