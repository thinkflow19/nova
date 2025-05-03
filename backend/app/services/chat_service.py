import os
import json
import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Callable, AsyncGenerator
from datetime import datetime
import httpx
from app.models.chat import ChatMessageBase
from app.services.database_service import DatabaseService
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.services.vector_store_service import (
    VectorStoreService,
    get_vector_store_service,
)

# Configure logging
logger = logging.getLogger(__name__)

# OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "gpt-4o-mini")


class ChatService:
    """Service for handling chat completions and LLM interactions."""

    def __init__(self):
        """Initialize the chat service with required dependencies."""
        self.db_service = DatabaseService()
        self.embedding_service = get_embedding_service()
        self.vector_store_service = get_vector_store_service()

        # Verify API keys
        if not OPENAI_API_KEY and not ANTHROPIC_API_KEY:
            logger.warning("No OpenAI or Anthropic API key found. LLM calls will fail.")

        logger.info("Chat service initialized")

    async def generate_completion(
        self,
        messages: List[ChatMessageBase],
        session_id: str,
        project_id: str,
        user_id: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Generate a chat completion from a list of messages.

        Args:
            messages: List of chat messages in the conversation
            session_id: Chat session ID
            project_id: Project ID
            user_id: User ID
            model: LLM model to use (defaults to system default)
            temperature: Temperature parameter for the LLM (0.0-1.0)
            max_tokens: Maximum tokens to generate

        Returns:
            Dictionary containing the completion result and additional metadata
        """
        try:
            start_time = time.time()
            logger.info(
                f"Generating completion for session {session_id} using model {model or DEFAULT_MODEL}"
            )

            # Get session data to check for project-specific context
            session = self.db_service.get_chat_session(session_id)

            # Check if the project has any documents to use as context
            project_documents = self.db_service.list_documents(project_id, limit=100)
            indexed_documents = [
                doc for doc in project_documents if doc.get("status") == "indexed"
            ]

            # If there are indexed documents, perform a semantic search to retrieve relevant context
            context_items = []
            if indexed_documents and len(messages) > 0:
                # Get the last user message to use as the search query
                last_user_message = messages[-1].content

                # Generate embedding for the query
                query_embedding = (
                    await self.embedding_service.generate_single_embedding(
                        last_user_message
                    )
                )

                # Search across all document namespaces for the project
                namespaces = [
                    doc["pinecone_namespace"]
                    for doc in indexed_documents
                    if doc.get("pinecone_namespace")
                ]

                # Search for relevant context across all namespaces
                if namespaces and query_embedding:
                    search_results = await self.vector_store_service.search(
                        query_embedding=query_embedding,
                        top_k=5,  # Get top 5 most relevant chunks
                        namespaces=namespaces,
                        filter_dict={"project_id": project_id},
                    )

                    # Extract text chunks and metadata for context
                    if search_results:
                        for result in search_results:
                            if result.get("metadata") and result.get("metadata").get(
                                "text"
                            ):
                                context_items.append(
                                    {
                                        "text": result["metadata"]["text"],
                                        "document_id": result["metadata"].get(
                                            "document_id", "unknown"
                                        ),
                                        "score": result.get("score", 0),
                                    }
                                )

            # If we found context, include it in the system message
            system_message = None
            context_text = ""

            if context_items:
                # Format the context chunks
                context_text = "\n\n".join(
                    [
                        f"Document chunk {i+1} (relevance: {item['score']:.2f}):\n{item['text']}"
                        for i, item in enumerate(context_items)
                    ]
                )

                # Create a system message with context
                system_message = {
                    "role": "system",
                    "content": f"You are a helpful assistant with access to the following information from the user's documents. Use this information to answer the user's questions when relevant.\n\nContext from documents:\n{context_text}\n\nIf the provided context doesn't contain relevant information to answer the user's question, use your general knowledge to help them, but acknowledge when you're not drawing from their documents.",
                }
            else:
                # Default system message
                system_message = {
                    "role": "system",
                    "content": "You are a helpful assistant. Answer the user's questions clearly and concisely.",
                }

            # Add custom system message if specified in session model_config
            if session.get("model_config") and session["model_config"].get(
                "system_prompt"
            ):
                system_message["content"] = session["model_config"]["system_prompt"]

                # If we have context, append it to the custom system prompt
                if context_items:
                    system_message[
                        "content"
                    ] += f"\n\nContext from documents:\n{context_text}"

            # Build the messages array for the API
            api_messages = [
                {"role": system_message["role"], "content": system_message["content"]}
            ]

            # Add the conversation history
            for msg in messages:
                api_messages.append({"role": msg.role, "content": msg.content})

            # Determine which API to use based on the model
            model_to_use = model or DEFAULT_MODEL

            if model_to_use.startswith("gpt-") or any(
                m in model_to_use for m in ["text-davinci", "gpt3", "gpt4"]
            ):
                # Use OpenAI API
                completion = await self._call_openai(
                    messages=api_messages,
                    model=model_to_use,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            elif any(m in model_to_use for m in ["claude", "anthropic"]):
                # Use Anthropic API
                completion = await self._call_anthropic(
                    messages=api_messages,
                    model=model_to_use,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )
            else:
                # Default to OpenAI if model is unrecognized
                logger.warning(
                    f"Unrecognized model: {model_to_use}, defaulting to OpenAI"
                )
                completion = await self._call_openai(
                    messages=api_messages,
                    model=DEFAULT_MODEL,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

            # Save the assistant's response to the database
            assistant_message = self.db_service.create_chat_message(
                session_id=session_id,
                project_id=project_id,
                user_id=user_id,
                role="assistant",
                content=completion["content"],
                tokens=completion.get("tokens"),
                metadata={
                    "model": model_to_use,
                    "temperature": temperature,
                    "processing_time": time.time() - start_time,
                    "context_used": True if context_items else False,
                    "context_count": len(context_items),
                },
            )

            # Return the complete result
            return {
                "message": assistant_message,
                "model": model_to_use,
                "usage": completion.get("usage", {}),
                "context_used": True if context_items else False,
                "processing_time": time.time() - start_time,
            }

        except Exception as e:
            logger.error(f"Error generating completion: {str(e)}")
            # Try to save error message as assistant message
            try:
                error_message = f"Error generating response: {str(e)}"
                self.db_service.create_chat_message(
                    session_id=session_id,
                    project_id=project_id,
                    user_id=user_id,
                    role="assistant",
                    content=error_message,
                    metadata={"error": True, "error_message": str(e)},
                )
            except Exception as save_err:
                logger.error(f"Error saving error message: {str(save_err)}")

            raise

    async def generate_completion_stream(
        self,
        messages: List[ChatMessageBase],
        session_id: str,
        project_id: str,
        user_id: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Generate a streaming chat completion.

        Similar to generate_completion but returns a stream of content
        that can be sent to the client as it's generated.
        """
        try:
            start_time = time.time()
            logger.info(f"Starting streaming completion for session {session_id}")

            # Get session data for system prompt
            session = self.db_service.get_chat_session(session_id)

            # Similar context retrieval logic as in generate_completion
            # ... (for brevity, imagine the same context retrieval code is here) ...

            # For now, simplify and use a basic system message
            system_message = {
                "role": "system",
                "content": "You are a helpful assistant. Answer the user's questions clearly and concisely.",
            }

            # Add custom system message if specified in session model_config
            if session.get("model_config") and session["model_config"].get(
                "system_prompt"
            ):
                system_message["content"] = session["model_config"]["system_prompt"]

            # Build the messages array for the API
            api_messages = [
                {"role": system_message["role"], "content": system_message["content"]}
            ]

            # Add the conversation history
            for msg in messages:
                api_messages.append({"role": msg.role, "content": msg.content})

            # Collect the entire generated content for saving later
            full_content = ""
            chunk_count = 0

            # Start the streaming process
            model_to_use = model or DEFAULT_MODEL

            # Use the appropriate streaming API
            if model_to_use.startswith("gpt-") or any(
                m in model_to_use for m in ["text-davinci", "gpt3", "gpt4"]
            ):
                async for chunk in self._stream_openai(
                    messages=api_messages,
                    model=model_to_use,
                    temperature=temperature,
                    max_tokens=max_tokens,
                ):
                    chunk_count += 1
                    content = chunk.get("content", "")
                    if content:
                        full_content += content
                        # Format as SSE
                        yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"

            elif any(m in model_to_use for m in ["claude", "anthropic"]):
                async for chunk in self._stream_anthropic(
                    messages=api_messages,
                    model=model_to_use,
                    temperature=temperature,
                    max_tokens=max_tokens,
                ):
                    chunk_count += 1
                    content = chunk.get("content", "")
                    if content:
                        full_content += content
                        # Format as SSE
                        yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"

            else:
                # Default to OpenAI if model is unrecognized
                logger.warning(
                    f"Unrecognized model for streaming: {model_to_use}, defaulting to OpenAI"
                )
                async for chunk in self._stream_openai(
                    messages=api_messages,
                    model=DEFAULT_MODEL,
                    temperature=temperature,
                    max_tokens=max_tokens,
                ):
                    chunk_count += 1
                    content = chunk.get("content", "")
                    if content:
                        full_content += content
                        # Format as SSE
                        yield f"data: {json.dumps({'content': content, 'done': False})}\n\n"

            # Save the complete message to the database after streaming is done
            processing_time = time.time() - start_time
            self.db_service.create_chat_message(
                session_id=session_id,
                project_id=project_id,
                user_id=user_id,
                role="assistant",
                content=full_content,
                metadata={
                    "model": model_to_use,
                    "temperature": temperature,
                    "processing_time": processing_time,
                    "chunk_count": chunk_count,
                    "streaming": True,
                },
            )

            # Send a final message to indicate completion
            yield f"data: {json.dumps({'content': '', 'done': True, 'model': model_to_use, 'processing_time': processing_time})}\n\n"

        except Exception as e:
            logger.error(f"Error in streaming completion: {str(e)}")
            # Try to save error message as assistant message
            try:
                error_message = f"Error generating response: {str(e)}"
                self.db_service.create_chat_message(
                    session_id=session_id,
                    project_id=project_id,
                    user_id=user_id,
                    role="assistant",
                    content=error_message,
                    metadata={
                        "error": True,
                        "error_message": str(e),
                        "streaming": True,
                    },
                )
            except Exception as save_err:
                logger.error(f"Error saving streaming error message: {str(save_err)}")

            # Send an error message to the client
            yield f"data: {json.dumps({'error': str(e), 'done': True})}\n\n"

    async def _call_openai(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Call the OpenAI API to generate a completion."""
        if not OPENAI_API_KEY:
            raise ValueError("OpenAI API key not configured")

        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
            }

            if max_tokens:
                payload["max_tokens"] = max_tokens

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    json=payload,
                    headers=headers,
                )

                response_data = response.json()

                if response.status_code != 200:
                    error_message = response_data.get("error", {}).get(
                        "message", "Unknown error"
                    )
                    logger.error(f"OpenAI API error: {error_message}")
                    raise Exception(f"OpenAI API error: {error_message}")

                # Extract content and token usage
                content = response_data["choices"][0]["message"]["content"]
                usage = response_data.get("usage", {})
                completion_tokens = usage.get("completion_tokens", 0)

                return {"content": content, "tokens": completion_tokens, "usage": usage}

        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            raise

    async def _call_anthropic(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Call the Anthropic API to generate a completion."""
        if not ANTHROPIC_API_KEY:
            raise ValueError("Anthropic API key not configured")

        try:
            # Convert OpenAI-style messages to Anthropic format
            anthropic_messages = []
            for msg in messages:
                anthropic_messages.append(
                    {
                        "role": (
                            "assistant"
                            if msg["role"] == "assistant"
                            else "user" if msg["role"] == "user" else "system"
                        ),
                        "content": msg["content"],
                    }
                )

            payload = {
                "model": model,
                "messages": anthropic_messages,
                "temperature": temperature,
                "max_tokens": max_tokens or 4096,
                "stream": False,
            }

            headers = {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            }

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    json=payload,
                    headers=headers,
                )

                response_data = response.json()

                if response.status_code != 200:
                    error_message = response_data.get("error", {}).get(
                        "message", "Unknown error"
                    )
                    logger.error(f"Anthropic API error: {error_message}")
                    raise Exception(f"Anthropic API error: {error_message}")

                # Extract content (Anthropic doesn't provide detailed token usage)
                content = response_data["content"][0]["text"]

                # Estimate tokens (Anthropic doesn't provide this)
                estimated_tokens = len(content) // 4  # Rough estimate

                return {
                    "content": content,
                    "tokens": estimated_tokens,
                    "usage": {"completion_tokens": estimated_tokens},
                }

        except Exception as e:
            logger.error(f"Error calling Anthropic API: {str(e)}")
            raise

    async def _stream_openai(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream a completion from the OpenAI API."""
        if not OPENAI_API_KEY:
            raise ValueError("OpenAI API key not configured")

        try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "stream": True,
            }

            if max_tokens:
                payload["max_tokens"] = max_tokens

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
            }

            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream(
                    "POST",
                    "https://api.openai.com/v1/chat/completions",
                    json=payload,
                    headers=headers,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        try:
                            error_data = json.loads(error_text)
                            error_message = error_data.get("error", {}).get(
                                "message", "Unknown error"
                            )
                        except:
                            error_message = f"HTTP error {response.status_code}: {error_text.decode('utf-8')}"
                        raise Exception(f"OpenAI API streaming error: {error_message}")

                    # Process the stream
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            line = line[6:]  # Remove the "data: " prefix

                            if line.strip() == "[DONE]":
                                break

                            try:
                                chunk = json.loads(line)
                                delta = chunk["choices"][0]["delta"]

                                # Only yield content if there is any
                                if "content" in delta and delta["content"]:
                                    yield {"content": delta["content"]}
                            except json.JSONDecodeError:
                                logger.warning(
                                    f"Failed to parse OpenAI streaming chunk: {line}"
                                )
                            except KeyError as e:
                                logger.warning(
                                    f"Missing key in OpenAI streaming response: {e}"
                                )

        except Exception as e:
            logger.error(f"Error in OpenAI streaming: {str(e)}")
            raise

    async def _stream_anthropic(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream a completion from the Anthropic API."""
        if not ANTHROPIC_API_KEY:
            raise ValueError("Anthropic API key not configured")

        try:
            # Convert OpenAI-style messages to Anthropic format
            anthropic_messages = []
            for msg in messages:
                anthropic_messages.append(
                    {
                        "role": (
                            "assistant"
                            if msg["role"] == "assistant"
                            else "user" if msg["role"] == "user" else "system"
                        ),
                        "content": msg["content"],
                    }
                )

            payload = {
                "model": model,
                "messages": anthropic_messages,
                "temperature": temperature,
                "max_tokens": max_tokens or 4096,
                "stream": True,
            }

            headers = {
                "Content-Type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
            }

            async with httpx.AsyncClient(timeout=300.0) as client:
                async with client.stream(
                    "POST",
                    "https://api.anthropic.com/v1/messages",
                    json=payload,
                    headers=headers,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        try:
                            error_data = json.loads(error_text)
                            error_message = error_data.get("error", {}).get(
                                "message", "Unknown error"
                            )
                        except:
                            error_message = f"HTTP error {response.status_code}: {error_text.decode('utf-8')}"
                        raise Exception(
                            f"Anthropic API streaming error: {error_message}"
                        )

                    # Process the stream
                    buffer = ""
                    async for chunk in response.aiter_bytes():
                        buffer += chunk.decode("utf-8")

                        # Look for complete events
                        while "\n\n" in buffer:
                            event, buffer = buffer.split("\n\n", 1)

                            if event.startswith("data: "):
                                data = event[6:].strip()  # Remove the "data: " prefix

                                if data == "[DONE]":
                                    break

                                try:
                                    event_data = json.loads(data)

                                    # Extract delta content (if any)
                                    if event_data.get("type") == "content_block_delta":
                                        content = event_data.get("delta", {}).get(
                                            "text", ""
                                        )
                                        if content:
                                            yield {"content": content}
                                except json.JSONDecodeError:
                                    logger.warning(
                                        f"Failed to parse Anthropic streaming chunk: {data}"
                                    )
                                except KeyError as e:
                                    logger.warning(
                                        f"Missing key in Anthropic streaming response: {e}"
                                    )

        except Exception as e:
            logger.error(f"Error in Anthropic streaming: {str(e)}")
            raise

    async def generate_title_for_session(
        self, session_id: str, project_id: str, user_id: str
    ) -> Optional[str]:
        """Generate a title for a chat session based on its first few messages."""
        try:
            # Get the first few messages from the session
            messages = self.db_service.list_chat_messages(
                session_id=session_id, limit=3
            )

            if not messages:
                logger.warning(
                    f"No messages found in session {session_id} for title generation"
                )
                return None

            # Create a prompt to generate a title
            prompt = f"Based on this conversation, generate a concise and descriptive title (3-5 words):\n\n"

            for msg in messages:
                prompt += f"{msg['role'].capitalize()}: {msg['content']}\n"

            # Use a simple model with low-cost to generate the title
            title_model = "gpt-3.5-turbo"

            title_messages = [
                {
                    "role": "system",
                    "content": "You generate short, descriptive titles for conversations. Output only the title text without quotes or additional explanation.",
                },
                {"role": "user", "content": prompt},
            ]

            title_completion = await self._call_openai(
                messages=title_messages,
                model=title_model,
                temperature=0.7,
                max_tokens=20,
            )

            # Extract and clean the title
            title = title_completion["content"].strip()

            # Remove any quotes that might be around the title
            title = title.strip("\"'")

            # Update the session title in the database
            self.db_service.execute_custom_query(
                table="chat_sessions",
                query_params={"id": f"eq.{session_id}", "update": {"title": title}},
            )

            logger.info(f"Generated title for session {session_id}: {title}")
            return title

        except Exception as e:
            logger.error(f"Error generating title for session {session_id}: {str(e)}")
            return None


# Global service instance
_chat_service = None


def get_chat_service() -> ChatService:
    """Get or create a ChatService instance."""
    global _chat_service
    if _chat_service is None:
        _chat_service = ChatService()
    return _chat_service
