import os
import openai
from dotenv import load_dotenv
from fastapi import HTTPException, status
from app.services.embedding_service import query_embeddings
from typing import List, Dict
import json

# Load environment variables
load_dotenv()

# OpenAI configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY


def format_context(relevant_chunks: List[Dict]) -> str:
    """Format relevant document chunks into context for the LLM."""
    context = "Information from documents:\n\n"

    for i, chunk in enumerate(relevant_chunks):
        context += f"Document {i+1} - {chunk['file_name']}:\n{chunk['text']}\n\n"

    return context


def get_system_message(tone: str, project_name: str) -> str:
    """Generate system message based on the bot's tone."""
    base_prompt = f"You are an AI assistant for {project_name}. Answer questions based ONLY on the provided context information. "

    tone_additions = {
        "friendly": "Your responses should be warm, approachable, and conversational. Use a friendly tone that makes users feel comfortable.",
        "formal": "Your responses should be professional, polite, and use formal language. Maintain a business-appropriate tone throughout.",
        "technical": "Your responses should be detailed and precise, using technical terminology where appropriate. Focus on accuracy and completeness.",
        "supportive": "Your responses should be empathetic and reassuring. Acknowledge user concerns and provide helpful, supportive guidance.",
    }

    if tone in tone_additions:
        return base_prompt + tone_additions[tone]
    else:
        return base_prompt + tone_additions["friendly"]  # Default to friendly


def generate_chat_response(
    query: str, project_id: str, project_name: str, tone: str
) -> Dict:
    """Generate a chat response using RAG with OpenAI."""
    try:
        # Get relevant document chunks
        relevant_chunks = query_embeddings(query, top_k=3, project_id=project_id)

        # If no relevant chunks found
        if not relevant_chunks:
            return {
                "response": "I don't have enough information to answer that question based on the documents provided.",
                "sources": [],
            }

        # Format context
        context = format_context(relevant_chunks)

        # Generate system message based on tone
        system_message = get_system_message(tone, project_name)

        # Prepare chat completion request
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"},
        ]

        # Generate response
        response = openai.chat.completions.create(
            model="gpt-4-turbo", messages=messages, temperature=0.7, max_tokens=1000
        )

        # Extract sources for citation
        sources = []
        for chunk in relevant_chunks:
            if chunk["file_name"] not in sources:
                sources.append(chunk["file_name"])

        return {"response": response.choices[0].message.content, "sources": sources}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate chat response: {str(e)}",
        )
