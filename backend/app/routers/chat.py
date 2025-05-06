import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Optional, List, Any
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
from app.services.chat_service import get_chat_service
from pydantic import BaseModel
from datetime import datetime
from fastapi.responses import StreamingResponse
import uuid
from app.models.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatCompletionRequest,
)
from app.services.database_service import DatabaseService

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

# Initialize services
db_service = DatabaseService()
chat_service = get_chat_service()


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


@router.post(
    "/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED
)
async def create_chat_session(
    session: ChatSessionCreate, current_user=Depends(get_current_user)
):
    """Create a new chat session."""
    try:
        logger.info(f"Creating chat session for project: {session.project_id}")

        # Verify project exists and user has access to it
        project = db_service.get_project(str(session.project_id))
        if project["user_id"] != current_user["id"]:
            # Check if project is shared with the user
            shared_access = db_service.execute_custom_query(
                table="shared_objects",
                query_params={
                    "select": "*",
                    "filters": {
                        "object_type": "eq.project",
                        "object_id": f"eq.{session.project_id}",
                        "shared_with": f"eq.{current_user['id']}",
                    },
                },
            )

            if not shared_access and not project["is_public"]:
                logger.warning(
                    f"User {current_user['id']} not authorized to create chat session in project {session.project_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to create chat session in this project",
                )

        # Create chat session in database
        created_session = db_service.create_chat_session(
            project_id=str(session.project_id),
            user_id=current_user["id"],
            title=session.title,
            summary=session.summary,
            model_config=session.model_config,
        )

        logger.info(f"Chat session created with ID: {created_session['id']}")
        return created_session
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error creating chat session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat session: {str(e)}",
        )


@router.get("/sessions/project/{project_id}", response_model=List[ChatSessionResponse])
async def list_chat_sessions(
    project_id: str,
    current_user=Depends(get_current_user),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all chat sessions for a project."""
    try:
        logger.info(f"Listing chat sessions for project ID: {project_id}")

        # Verify project exists and user has access to it
        project = db_service.get_project(project_id)
        if project["user_id"] != current_user["id"] and not project["is_public"]:
            # Check if project is shared with the user
            shared_access = db_service.execute_custom_query(
                table="shared_objects",
                query_params={
                    "select": "*",
                    "filters": {
                        "object_type": "eq.project",
                        "object_id": f"eq.{project_id}",
                        "shared_with": f"eq.{current_user['id']}",
                    },
                },
            )

            if not shared_access:
                logger.warning(
                    f"User {current_user['id']} not authorized to access project {project_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access chat sessions in this project",
                )

        # Query chat sessions from database
        sessions = db_service.list_chat_sessions(
            project_id=project_id, limit=limit, offset=offset
        )

        logger.info(f"Found {len(sessions)} chat sessions for project")
        return sessions
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error listing chat sessions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list chat sessions: {str(e)}",
        )


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(session_id: str, current_user=Depends(get_current_user)):
    """Get a specific chat session by ID."""
    try:
        logger.info(f"Getting chat session with ID: {session_id}")

        # Get session from database
        session = db_service.get_chat_session(session_id)

        # Verify access
        if session["user_id"] != current_user["id"]:
            # Get the project to check if it's public
            project = db_service.get_project(session["project_id"])

            if not project["is_public"]:
                # Check if the project is shared with the user
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{session['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to access chat session {session_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to access this chat session",
                    )

        logger.info(f"Chat session found: {session['id']}")
        return session
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error getting chat session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat session: {str(e)}",
        )


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_chat_session(
    session_id: str,
    session_update: ChatSessionUpdate,
    current_user=Depends(get_current_user),
):
    """Update a chat session."""
    try:
        logger.info(f"Updating chat session with ID: {session_id}")

        # Get session to check ownership
        existing_session = db_service.get_chat_session(session_id)

        # Verify ownership
        if existing_session["user_id"] != current_user["id"]:
            # Check if the user has write access through project sharing
            project = db_service.get_project(existing_session["project_id"])

            if project["user_id"] != current_user["id"]:
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{existing_session['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                            "permission_level": "in.(write,admin)",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to update chat session {session_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to update this chat session",
                    )

        # Prepare update data
        update_data = session_update.dict(exclude_unset=True)

        # Update session in database
        updated_session = db_service.execute_custom_query(
            table="chat_sessions",
            query_params={"id": f"eq.{session_id}", "update": update_data},
        )

        if not updated_session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found",
            )

        logger.info(f"Chat session updated successfully: {session_id}")
        return (
            updated_session[0] if isinstance(updated_session, list) else updated_session
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error updating chat session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update chat session: {str(e)}",
        )


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_session(session_id: str, current_user=Depends(get_current_user)):
    """Delete a chat session."""
    try:
        logger.info(f"Deleting chat session with ID: {session_id}")

        # Get session to check ownership
        existing_session = db_service.get_chat_session(session_id)

        # Only the owner can delete a session
        if existing_session["user_id"] != current_user["id"]:
            # Check if user is project admin
            project = db_service.get_project(existing_session["project_id"])

            if project["user_id"] != current_user["id"]:
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{existing_session['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                            "permission_level": "eq.admin",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to delete chat session {session_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to delete this chat session",
                    )

        # Delete all messages first (cascade deletion should handle this, but to be safe)
        db_service.execute_custom_query(
            table="chat_messages",
            query_params={"session_id": f"eq.{session_id}", "delete": "true"},
        )

        # Delete session from database
        db_service.execute_custom_query(
            table="chat_sessions",
            query_params={"id": f"eq.{session_id}", "delete": "true"},
        )

        logger.info(f"Chat session {session_id} deleted successfully")
        return None
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error deleting chat session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete chat session: {str(e)}",
        )


@router.get("/messages/{session_id}", response_model=List[ChatMessageResponse])
async def list_chat_messages(
    session_id: str,
    current_user=Depends(get_current_user),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all messages in a chat session."""
    try:
        logger.info(f"Listing chat messages for session ID: {session_id}")

        # Get session to check access
        session = db_service.get_chat_session(session_id)

        # Verify access
        if session["user_id"] != current_user["id"]:
            # Get the project to check if it's public
            project = db_service.get_project(session["project_id"])

            if not project["is_public"]:
                # Check if the project is shared with the user
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{session['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to access chat session {session_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to access messages in this chat session",
                    )

        # Query messages from database
        messages = db_service.list_chat_messages(
            session_id=session_id, limit=limit, offset=offset
        )

        logger.info(f"Found {len(messages)} chat messages for session")
        return messages
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error listing chat messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list chat messages: {str(e)}",
        )


@router.post(
    "/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED
)
async def create_chat_message(
    message: ChatMessageCreate, current_user=Depends(get_current_user)
):
    """Create a new chat message."""
    try:
        logger.info(f"Creating chat message for session: {message.session_id}")

        # Get session to check access
        session = db_service.get_chat_session(str(message.session_id))

        # Verify access
        if session["user_id"] != current_user["id"]:
            # Get the project to check if it's public or shared
            project = db_service.get_project(session["project_id"])

            if not project["is_public"]:
                # Check if the project is shared with the user
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{session['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to add messages to chat session {message.session_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to add messages to this chat session",
                    )

        # Create message in database
        created_message = db_service.create_chat_message(
            session_id=str(message.session_id),
            project_id=str(message.project_id),
            user_id=current_user["id"],
            role=message.role,
            content=message.content,
            tokens=message.tokens,
            metadata=message.metadata,
        )

        logger.info(f"Chat message created with ID: {created_message['id']}")
        return created_message
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error creating chat message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat message: {str(e)}",
        )


@router.post("/completions")
async def create_chat_completion(
    request: ChatCompletionRequest, current_user=Depends(get_current_user)
):
    """Create a chat completion (generate AI response)."""
    try:
        logger.info(f"Creating chat completion for session: {request.session_id}")

        # Verify access to the chat session
        session = db_service.get_chat_session(request.session_id)

        # Check user access to the session
        if session["user_id"] != current_user["id"]:
            # Get the project to check if it's public or shared
            project = db_service.get_project(session["project_id"])

            if not project["is_public"]:
                # Check if the project is shared with the user
                shared_access = db_service.execute_custom_query(
                    table="shared_objects",
                    query_params={
                        "select": "*",
                        "filters": {
                            "object_type": "eq.project",
                            "object_id": f"eq.{session['project_id']}",
                            "shared_with": f"eq.{current_user['id']}",
                        },
                    },
                )

                if not shared_access:
                    logger.warning(
                        f"User {current_user['id']} not authorized to generate completions for session {request.session_id}"
                    )
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Not authorized to generate completions for this session",
                    )

        # Save the user message
        db_service.create_chat_message(
            session_id=request.session_id,
            project_id=request.project_id,
            user_id=current_user["id"],
            role="user",
            content=request.messages[-1].content if request.messages else "",
            metadata={},
        )

        # If streaming is requested
        if request.stream:
            return StreamingResponse(
                chat_service.generate_completion_stream(
                    messages=request.messages,
                    session_id=request.session_id,
                    project_id=request.project_id,
                    user_id=current_user["id"],
                    model=request.model,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                ),
                media_type="text/event-stream",
            )
        else:
            # Generate the completion
            completion_result = await chat_service.generate_completion(
                messages=request.messages,
                session_id=request.session_id,
                project_id=request.project_id,
                user_id=current_user["id"],
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
            )

            return completion_result
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error creating chat completion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat completion: {str(e)}",
        )
