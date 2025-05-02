import os
import json
import logging
import openai
import uuid
import requests
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

# Import services
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService
from app.services.database_service import DatabaseService
from app.services.mock_openai_service import MockChatCompletion, MockEmbedding

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.error("Missing OpenAI API key in environment variables")

# Configure OpenAI
openai.api_key = OPENAI_API_KEY

# LLM model to use for chat
DEFAULT_MODEL = os.getenv("DEFAULT_CHAT_MODEL", "gpt-3.5-turbo")


class ChatService:
    """Chat service with RAG capability for projects"""

    def __init__(self):
        """Initialize the chat service with required dependencies"""
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStoreService()
        self.db_service = DatabaseService()
        logger.info("Chat service initialized with RAG components")

        # Do NOT attempt to create tables at runtime.
        # Schema should be managed explicitly via scripts/db_setup/create_tables.py
        # self._ensure_chat_table_exists()

    async def _get_retrieval_context(
        self, query: str, project_id: str, top_k: int = 3
    ) -> str:
        """
        Retrieve relevant context from the vector store based on the query
        """
        try:
            # Generate embedding for the query
            query_embedding = await self.embedding_service.generate_embedding(query)

            # Query the vector store
            results = await self.vector_store.query_vectors(
                query_embedding=query_embedding, top_k=top_k, project_id=project_id
            )

            if not results:
                logger.info(f"No context found for query in project {project_id}")
                return ""

            # Format the context from retrieved documents
            context_parts = []
            for i, result in enumerate(results):
                metadata = result.get("metadata", {})
                content = metadata.get("chunk_text", "")
                source = metadata.get("source", "Unknown")

                if content:
                    context_parts.append(f"[Document {i+1} from {source}]: {content}")

            return "\n\n".join(context_parts)

        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            return ""

    def _build_chat_prompt(
        self, user_query: str, context: str, chat_history: List[Dict[str, str]] = None
    ) -> List[Dict]:
        """
        Build the prompt for the chat completion
        """
        messages = []

        # System message with instructions for RAG
        system_message = {
            "role": "system",
            "content": "You are an AI assistant integrated with a document knowledge base. "
            "Answer questions based on the context provided. "
            "If the answer cannot be found in the context, respond with what you know "
            "but clarify when you are not using the provided context. "
            "Keep your answers concise, informative and helpful.",
        }
        messages.append(system_message)

        # Add chat history if available
        if chat_history:
            # Limit history to last 5 exchanges to avoid token limits
            for msg in chat_history[-5:]:
                messages.append({"role": msg["role"], "content": msg["content"]})

        # Add context from retrieved documents
        if context:
            messages.append(
                {
                    "role": "system",
                    "content": f"Here is relevant information from the knowledge base:\n\n{context}",
                }
            )

        # Add user query
        messages.append({"role": "user", "content": user_query})

        return messages

    async def _store_chat_message(
        self, project_id: str, user_id: str, role: str, content: str
    ) -> Dict:
        """
        Store a chat message in the database
        """
        try:
            # Create a message payload
            message_data = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "user_id": user_id,
                "role": role,
                "content": content,
                "created_at": datetime.utcnow().isoformat(),
            }

            # Insert into database using a custom query
            response = requests.post(
                f"{self.db_service.rest_url}/chat_messages",
                headers=self.db_service.headers,
                json=message_data,
            )

            if response.status_code >= 400:
                # Only log as error if it's not a table-not-exists issue
                if (
                    response.status_code == 404
                    or '"message":"relation \\"public.chat_messages\\" does not exist"'
                    in str(response.text)
                ):
                    logger.warning(
                        "Failed to store chat message: chat_messages table does not exist"
                    )
                else:
                    logger.error(f"Failed to store chat message: {response.text}")
                return None

            result = response.json()
            return result[0] if isinstance(result, list) else result

        except Exception as e:
            logger.error(f"Error storing chat message: {str(e)}")
            return None

    async def get_chat_history(self, project_id: str, limit: int = 50) -> List[Dict]:
        """
        Retrieve chat history for a project
        """
        try:
            # Query parameters
            params = {
                "project_id": f"eq.{project_id}",
                "order": "created_at.asc",
                "limit": str(limit),
            }

            # Get chat history
            response = requests.get(
                f"{self.db_service.rest_url}/chat_messages",
                headers=self.db_service.headers,
                params=params,
            )

            if response.status_code >= 400:
                # Only log as error if it's not a table-not-exists issue
                if (
                    response.status_code == 404
                    or '"message":"relation \\"public.chat_messages\\" does not exist"'
                    in str(response.text)
                ):
                    logger.warning(
                        "Failed to retrieve chat history: chat_messages table does not exist"
                    )
                else:
                    logger.error(f"Failed to retrieve chat history: {response.text}")
                return []

            return response.json()

        except Exception as e:
            logger.error(f"Error retrieving chat history: {str(e)}")
            return []

    async def process_message(
        self, project_id: str, user_id: str, message: str
    ) -> Dict[str, Any]:
        """
        Process a user message and generate a response using RAG
        """
        use_mock_service = False
        model_used = DEFAULT_MODEL

        try:
            # Store the user message
            # Add check for table existence before storing
            if not await self.db_service.table_exists("chat_messages"):
                logger.error(
                    "Chat messages table does not exist. Cannot store message."
                )
                # Decide how to handle - raise error? return error message?
                raise RuntimeError(
                    "Database not set up correctly: chat_messages table missing."
                )
            await self._store_chat_message(project_id, user_id, "user", message)

            # Get chat history
            chat_history = await self.get_chat_history(project_id)

            try:
                # Retrieve relevant context from vector store
                context = await self._get_retrieval_context(message, project_id)
            except Exception as e:
                logger.error(f"Error retrieving context: {str(e)}")
                context = ""
                # Only use mock service if context retrieval failed due to OpenAI quota
                if isinstance(e, openai.RateLimitError) or (
                    isinstance(e, openai.APIError)
                    and "insufficient_quota" in str(e).lower()
                ):
                    use_mock_service = True
                    logger.warning(
                        "Context retrieval failed due to OpenAI quota/rate limit."
                    )
                # Optional: Re-raise other context retrieval errors if critical?

            # Build the chat prompt
            messages = self._build_chat_prompt(message, context, chat_history)
            assistant_message = ""

            try:
                if use_mock_service:
                    logger.warning(
                        "Using mock chat completion due to previous API limitations"
                    )
                    response = await MockChatCompletion.create(
                        messages=messages, temperature=0.7, max_tokens=1000
                    )
                    model_used = "mock-fallback-model"
                else:
                    # Generate response using the real OpenAI API - no need to await
                    response = openai.chat.completions.create(
                        model=DEFAULT_MODEL,
                        messages=messages,
                        temperature=0.7,
                        max_tokens=1000,
                    )

                # Extract the assistant's reply
                assistant_message = response.choices[0].message.content

            except (
                openai.RateLimitError,
                openai.APIStatusError,
                openai.APIConnectionError,
            ) as api_err:
                logger.error(
                    f"OpenAI API error: {type(api_err).__name__}: {str(api_err)}"
                )
                # Fallback to mock service only on specific API errors
                if isinstance(api_err, openai.RateLimitError) or (
                    isinstance(api_err, openai.APIStatusError)
                    and "insufficient_quota" in str(api_err).lower()
                ):
                    try:
                        logger.warning(
                            "Falling back to mock service due to OpenAI API error"
                        )
                        mock_response = await MockChatCompletion.create(
                            messages=messages, temperature=0.7, max_tokens=1000
                        )
                        assistant_message = mock_response.choices[0].message.content
                        model_used = "mock-fallback-model"
                    except Exception as mock_e:
                        logger.error(f"Error with mock service fallback: {str(mock_e)}")
                        assistant_message = "I'm sorry, but I encountered issues contacting the AI service and the fallback service also failed. Please try again later."
                else:
                    # For other API errors, provide a generic error message
                    assistant_message = f"I'm sorry, but I encountered an issue contacting the AI service ({type(api_err).__name__}). Please try again later."
            except Exception as e:  # Catch other unexpected errors
                logger.error(
                    f"Unexpected error during chat completion: {str(e)}", exc_info=True
                )
                assistant_message = f"I'm sorry, but an unexpected error occurred while processing your request."

            # Ensure assistant_message has a value
            if not assistant_message:
                assistant_message = "I'm sorry, I couldn't generate a response."
                logger.error("Assistant message was empty after processing.")

            # Store the assistant message
            await self._store_chat_message(
                project_id, user_id, "assistant", assistant_message
            )

            # Return the response
            return {
                "message": assistant_message,
                "project_id": project_id,
                "used_context": bool(context),
                "model": model_used,
            }

        except RuntimeError as db_err:  # Catch the specific DB setup error
            logger.error(f"Database Error: {str(db_err)}")
            return {
                "message": "I'm sorry, there's a configuration issue with the chat history. Please contact support.",
                "project_id": project_id,
                "error": str(db_err),
            }
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}", exc_info=True)
            # Return a graceful error response
            return {
                "message": f"I'm sorry, but I encountered an error processing your request. Please try again later.",
                "project_id": project_id,
                "error": str(e),
            }


# Singleton instance
chat_service = ChatService()
