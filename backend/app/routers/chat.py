import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Optional, List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from app.services.dependencies import get_current_user, get_embedding_service, get_vector_store_service
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService
from app.services.chat_service import generate_chat_response
from pydantic import BaseModel
from datetime import datetime

# Load environment variables
load_dotenv()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)


class ChatRequest(BaseModel):
    query: str
    project_id: str
    save_history: bool = True


class ChatResponse(BaseModel):
    response: str
    sources: list
    conversation_id: Optional[str] = None
    retrieved_chunks: List[Dict]


class ChatQuery(BaseModel):
    message: str


@router.post("/{project_id}", response_model=ChatResponse)
async def handle_chat(
    project_id: str,
    query: ChatQuery,
    current_user=Depends(get_current_user),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_store_service: VectorStoreService = Depends(get_vector_store_service),
):
    """Handles incoming chat messages, retrieves context, and generates a response."""
    try:
        logger.info(f"Received chat query for project {project_id}: {query.message}")

        # 1. Generate query embedding
        query_embedding = await embedding_service.generate_embedding(query.message)
        
        if not query_embedding:
             logger.error(f"Failed to generate embedding for query: {query.message}")
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process query embedding.")

        # 2. Query vector store for relevant chunks
        # Adjust top_k as needed
        retrieved_chunks = await vector_store_service.query_vectors(
            query_embedding=query_embedding, 
            top_k=3, 
            project_id=project_id
        )
        
        logger.info(f"Retrieved {len(retrieved_chunks)} chunks for project {project_id}")
        
        # --- Placeholder for RAG ---
        # TODO: Implement RAG logic here
        # 1. Format retrieved chunks into context string.
        # 2. Create a prompt combining user query and context.
        # 3. Send prompt to an LLM (e.g., using langchain_openai.ChatOpenAI).
        # 4. Return the LLM's response.
        
        # For now, just return the chunks found
        placeholder_response = "Response generation not yet implemented. Retrieved context chunks:"
        
        return ChatResponse(
            response=placeholder_response, 
            retrieved_chunks=retrieved_chunks
        )

    except Exception as e:
        logger.error(f"Error handling chat for project {project_id}: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to handle chat message: {str(e)}",
        )


@router.post("/public")
async def public_chat(request: ChatRequest):
    """Public endpoint for chatbot widget (no auth required)."""
    try:
        # Verify project exists
        response = (
            supabase.table("projects")
            .select("*")
            .eq("id", request.project_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found"
            )

        project = response.data[0]

        # Only allow active projects
        if project["status"] != "active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This bot is currently inactive",
            )

        # Generate response
        chat_response = generate_chat_response(
            query=request.query,
            project_id=request.project_id,
            project_name=project["project_name"],
            tone=project["tone"],
        )

        # Save to chat history if requested
        if request.save_history:
            history_data = {
                "project_id": request.project_id,
                "user_query": request.query,
                "bot_response": chat_response["response"],
                "created_at": datetime.utcnow().isoformat(),
            }

            history_response = (
                supabase.table("chat_history").insert(history_data).execute()
            )
            if history_response.data:
                chat_response["conversation_id"] = history_response.data[0]["id"]

        return chat_response

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate chat response: {str(e)}",
        )
