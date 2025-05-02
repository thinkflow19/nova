import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Optional, List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from app.services.dependencies import (
    get_current_user,
    get_embedding_service,
    get_vector_store_service,
)
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService
from app.services.chat_service import chat_service
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
    sources: list = []
    conversation_id: Optional[str] = None
    used_context: bool = False
    model: Optional[str] = None


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
        logger.info(
            f"Received chat query for project {project_id} from user {current_user['id']}: {query.message}"
        )

        # Process the message using the chat service
        response = await chat_service.process_message(
            project_id=project_id, user_id=current_user["id"], message=query.message
        )

        # Extract information from the response
        sources = []
        if "used_context" in response and response["used_context"]:
            # We could extract source information if needed
            # This is a placeholder for future enhancement
            pass

        return ChatResponse(
            response=response["message"],
            sources=sources,
            used_context=response.get("used_context", False),
            model=response.get("model"),
        )

    except Exception as e:
        logger.error(
            f"Error handling chat for project {project_id}: {e}", exc_info=True
        )
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

        # Generate response using our chat service instead of the old function
        chat_result = await chat_service.process_message(
            project_id=request.project_id,
            user_id="public-user",  # Special ID for public access
            message=request.query,
        )

        # Save to chat history if requested
        conversation_id = None
        if request.save_history:
            history_data = {
                "project_id": request.project_id,
                "user_query": request.query,
                "bot_response": chat_result["message"],
                "created_at": datetime.utcnow().isoformat(),
            }

            history_response = (
                supabase.table("chat_history").insert(history_data).execute()
            )
            if history_response.data:
                conversation_id = history_response.data[0]["id"]

        return ChatResponse(
            response=chat_result["message"],
            sources=[],
            conversation_id=conversation_id,
            used_context=chat_result.get("used_context", False),
            model=chat_result.get("model"),
        )

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate chat response: {str(e)}",
        )


@router.get("/{project_id}/history")
async def get_chat_history(
    project_id: str, limit: int = 50, current_user=Depends(get_current_user)
):
    """Get chat history for a project"""
    try:
        # Verify user has access to project
        try:
            # Check if project exists in database
            response = (
                supabase.table("projects").select("*").eq("id", project_id).execute()
            )

            if not response.data:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
                )

            project = response.data[0]

            # Check if user has access to project
            if project["user_id"] != current_user["id"] and not project.get(
                "is_public", False
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this project",
                )

        except Exception as e:
            logger.error(f"Error verifying project access: {e}")
            raise

        # Get chat history from our service
        history = await chat_service.get_chat_history(project_id, limit)

        return {"messages": history}

    except Exception as e:
        logger.error(f"Error getting chat history: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat history: {str(e)}",
        )
