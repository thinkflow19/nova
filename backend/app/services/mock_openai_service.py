"""
Mock OpenAI service that provides fallback functionality when the real API is unavailable
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class MockChatCompletion:
    """Mock implementation of OpenAI's chat completion API"""

    @staticmethod
    async def create(messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
        """
        Generate a mock response for chat completion.

        Args:
            messages: List of message dictionaries with 'role' and 'content'
            **kwargs: Additional arguments that would be passed to OpenAI

        Returns:
            Mock response object with structure similar to OpenAI's response
        """
        logger.info("Using mock chat completion service")

        # Extract the user's message (usually the last one)
        user_message = ""
        for msg in reversed(messages):
            if msg["role"] == "user":
                user_message = msg["content"]
                break

        # Get context from system messages if available
        context = ""
        for msg in messages:
            if msg["role"] == "system" and "knowledge base" in msg["content"].lower():
                context = msg["content"]
                break

        # Generate appropriate mock response based on the query
        response_text = generate_mock_response(user_message, context)

        # Create a mock response object with similar structure to OpenAI's ChatCompletion
        # Structure that matches the new OpenAI SDK (without requiring await)
        chat_completion = {
            "choices": [
                {
                    "message": {"role": "assistant", "content": response_text},
                    "index": 0,
                    "finish_reason": "stop",
                }
            ],
            "created": 1683024000,
            "model": "mock-gpt-3.5-turbo",
            "usage": {
                "prompt_tokens": len(" ".join([m["content"] for m in messages])) // 4,
                "completion_tokens": len(response_text) // 4,
                "total_tokens": (
                    len(" ".join([m["content"] for m in messages])) + len(response_text)
                )
                // 4,
            },
        }

        # Create an object that mimics the actual response structure
        class MockChatCompletionResponse:
            def __init__(self, data):
                self.choices = [MockChoice(c) for c in data["choices"]]
                self.created = data["created"]
                self.model = data["model"]
                self.usage = data["usage"]

        class MockChoice:
            def __init__(self, choice_data):
                self.message = MockMessage(choice_data["message"])
                self.index = choice_data["index"]
                self.finish_reason = choice_data["finish_reason"]

        class MockMessage:
            def __init__(self, message_data):
                self.role = message_data["role"]
                self.content = message_data["content"]

        return MockChatCompletionResponse(chat_completion)


class MockEmbedding:
    """Mock implementation of OpenAI's embedding API"""

    @staticmethod
    async def create(input: List[str], **kwargs) -> Dict[str, Any]:
        """
        Generate mock embeddings.

        Args:
            input: List of text strings to embed
            **kwargs: Additional arguments that would be passed to OpenAI

        Returns:
            Mock response object with structure similar to OpenAI's response
        """
        logger.info(f"Using mock embedding service for {len(input)} texts")

        # Create a deterministic mock embedding based on the text
        mock_embeddings = []
        for text in input:
            # Create a simple mock embedding (1024 dimensions of data derived from text)
            # This is just for testing - not meant to be semantically useful
            base_values = [ord(c) % 10 for c in text[:20].ljust(20)]
            embedding = []
            for _ in range(51):  # Repeat the pattern to get 1024 dimensions
                embedding.extend(base_values)
            embedding = embedding[:1024]  # Ensure exactly 1024 dimensions

            mock_embeddings.append(
                {
                    "embedding": embedding,
                    "index": len(mock_embeddings),
                    "object": "embedding",
                }
            )

        # Build response object that mimics OpenAI's embedding response
        response_data = {
            "data": mock_embeddings,
            "model": "mock-text-embedding-ada-002",
            "usage": {
                "prompt_tokens": sum(len(t) // 4 for t in input),
                "total_tokens": sum(len(t) // 4 for t in input),
            },
        }

        # Create a class that mimics the actual response structure
        class MockEmbeddingResponse:
            def __init__(self, data):
                self.data = [MockEmbeddingItem(item) for item in data["data"]]
                self.model = data["model"]
                self.usage = data["usage"]

        class MockEmbeddingItem:
            def __init__(self, item_data):
                self.embedding = item_data["embedding"]
                self.index = item_data["index"]
                self.object = item_data["object"]

        return MockEmbeddingResponse(response_data)


def generate_mock_response(query: str, context: str = "") -> str:
    """
    Generate an appropriate mock response based on the query.

    Args:
        query: The user's query
        context: Any context information

    Returns:
        A mock response
    """
    query = query.lower()

    # Default response for when we can't generate anything specific
    default_response = "I'm currently operating in offline mode due to API limitations. I can only provide basic responses. Once the API quota is restored, I'll be able to assist you more effectively."

    # Check for specific query types
    if "hello" in query or "hi" in query:
        return "Hello! I'm currently running in offline mode due to API quota limitations. How can I help you with basic information today?"

    if "what" in query and "you" in query and "do" in query:
        return "I'm an AI assistant that can normally help you with various tasks including answering questions, generating content, and retrieving information from your documents. However, I'm currently running in offline mode due to API quota limitations. My capabilities are limited at the moment."

    if "help" in query:
        return "I'd be happy to help, but I'm currently running in offline mode due to API quota limitations. This means I can only provide basic responses. Please try again later when the API service is restored."

    if "openai" in query or "api" in query or "quota" in query:
        return "The OpenAI API quota for this account has been exceeded. This happens when you reach your usage limit. To resolve this, you can upgrade your OpenAI plan or wait until your quota resets. In the meantime, I'm operating in a limited offline mode."

    if context and "knowledge base" in context:
        return "I found some potentially relevant information in your knowledge base, but I'm currently running in offline mode due to API quota limitations. Once the API service is restored, I'll be able to provide more accurate and helpful responses based on your documents."

    return default_response
