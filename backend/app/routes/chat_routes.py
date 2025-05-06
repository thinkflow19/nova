from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.utils.auth import get_user_id
from app.services.chat_service import get_chat_service
from app.services.database_service import DatabaseService

router = APIRouter()
db_service = DatabaseService()
chat_service = get_chat_service()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    sources: Optional[List[str]] = []
    used_context: bool = False
    model: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]


@router.post("/chat/{project_id}", response_model=ChatResponse)
async def handle_chat(
    project_id: str, request: ChatRequest, current_user_id: str = Depends(get_user_id)
):
    """
    Handle incoming chat messages for a specific project using RAG.
    """
    try:
        # Verify user has access to project
        try:
            project = db_service.get_project(project_id)
            if project.get("user_id") != current_user_id and not project.get(
                "is_public", False
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this project",
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project not found or access denied: {str(e)}",
            )

        # Process the message using our chat service
        response = await chat_service.process_message(
            project_id=project_id, user_id=current_user_id, message=request.message
        )

        # Extract information from the response
        sources = []
        if "used_context" in response and response["used_context"]:
            # We could extract source information if needed
            # This is a placeholder for future enhancement
            pass

        # Return the formatted response
        return ChatResponse(
            reply=response["message"],
            sources=sources,
            used_context=response.get("used_context", False),
            model=response.get("model"),
        )

    except Exception as e:
        print(f"Chat processing error for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat message: {str(e)}",
        )


@router.get("/chat/{project_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    project_id: str, limit: int = 50, current_user_id: str = Depends(get_user_id)
):
    """
    Get chat history for a specific project
    """
    try:
        # Verify user has access to project
        try:
            project = db_service.get_project(project_id)
            if project.get("user_id") != current_user_id and not project.get(
                "is_public", False
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this project",
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project not found or access denied: {str(e)}",
            )

        # Get chat history
        history = await chat_service.get_chat_history(project_id, limit)

        return ChatHistoryResponse(messages=history)

    except Exception as e:
        print(f"Error retrieving chat history for project {project_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve chat history: {str(e)}",
        )
