import logging
import uuid
from contextlib import asynccontextmanager
from typing import Dict, List, Optional, AsyncGenerator
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
from uuid import UUID
import json
from app.services.dependencies import get_current_user, get_database_service
from app.services.chat_service import ChatService, get_chat_service
from app.services.database_service import DatabaseService
from app.models.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatCompletionRequest,
    ChatCompletionResponse,
)
from app.config.settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [%(request_id)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/chat",
    tags=["chat"],
)

@asynccontextmanager
async def request_context():
    """Context manager for request tracking"""
    request_id = str(uuid.uuid4())
    try:
        logger.context = {'request_id': request_id}
        yield request_id
    finally:
        logger.context = {}

async def validate_uuid(value: str) -> UUID:
    """Validate UUID format"""
    try:
        return UUID(value)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid UUID format")

@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_chat_session(
    session: ChatSessionCreate,
    current_user: Dict = Depends(get_current_user),
    db_service: DatabaseService = Depends(get_database_service),
):
    """Create a new chat session."""
    async with request_context() as request_id:
        logger.info(
            f"Creating chat session for user: {current_user['id']}, project_id: {session.project_id}"
        )

        # Validate project_id UUID and check if project exists
        # project_uuid = await validate_uuid(session.project_id) # Removed unnecessary validate_uuid call
        project_id_str = str(session.project_id) # Ensure it's a string for consistency and potential downstream uses

        # Check if project exists and belongs to the user or is public
        project = await db_service.get_project(project_id_str)
        if project["user_id"] != current_user["id"] and not project["is_public"]:
            logger.warning(f"Access denied to project {session.project_id} for user {current_user['id']}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to project"
            )

        new_session = await db_service.create_chat_session(
            project_id=project_id_str,
            user_id=current_user["id"],
            title=session.title,
            summary=session.summary,
            ai_config=session.model_config
        )
        logger.info(f"Chat session created successfully: {new_session['id']}")
        return ChatSessionResponse(**new_session)

@router.get(
    "/sessions/project/{project_id}",
    response_model=List[ChatSessionResponse]
)
async def list_chat_sessions(
    project_id: str,
    current_user: Dict = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db_service: DatabaseService = Depends(get_database_service)
):
    """List chat sessions filtered by project for the current user."""
    async with request_context() as request_id:
        user_id = current_user.get('id')
        logger.info(f"Listing sessions for user: {user_id}, project: {project_id}")

        try:
            project_uuid = await validate_uuid(project_id)
            sessions = await db_service.list_chat_sessions(
                user_id=user_id,
                project_id=str(project_uuid),
                limit=limit,
                offset=offset
            )
            logger.info(f"Retrieved {len(sessions)} sessions")
            return [ChatSessionResponse(**session) for session in sessions]

        except Exception as e:
            logger.error(f"Failed to list sessions: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list chat sessions"
            )

@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse
)
async def get_chat_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    db_service: DatabaseService = Depends(get_database_service)
):
    """Retrieve details of a specific chat session."""
    async with request_context() as request_id:
        user_id = current_user.get('id')
        logger.info(f"Getting session {session_id} for user: {user_id}")

        try:
            session_uuid = await validate_uuid(session_id)
            session = await db_service.get_chat_session(str(session_uuid))
            
            if session.get("user_id") != user_id:
                logger.warning(f"Access denied to session {session_id} for user {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this chat session"
                )
                
            logger.info(f"Session {session_id} retrieved successfully")
            return ChatSessionResponse(**session)

        except HTTPException as he:
            raise
        except Exception as e:
            logger.error(f"Failed to get session {session_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND if "not found" in str(e).lower()
                else status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Chat session not found" if "not found" in str(e).lower()
                else "Failed to get chat session"
            )

@router.patch(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse
)
async def update_chat_session(
    session_id: str,
    session_update: ChatSessionUpdate,
    current_user: Dict = Depends(get_current_user),
    db_service: DatabaseService = Depends(get_database_service)
):
    """Update a chat session's metadata."""
    async with request_context() as request_id:
        user_id = current_user.get('id')
        logger.info(f"Updating session {session_id} for user: {user_id}")

        try:
            session_uuid = await validate_uuid(session_id)
            await get_chat_session(str(session_uuid), current_user, db_service)
            
            update_data = session_update.model_dump(exclude_unset=True)
            if not update_data:
                logger.warning("No update data provided")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No update data provided"
                )

            updated_session = await db_service.update_chat_session(str(session_uuid), update_data)
            logger.info(f"Session {session_id} updated successfully")
            return ChatSessionResponse(**updated_session)

        except HTTPException as he:
            raise
        except Exception as e:
            logger.error(f"Failed to update session {session_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update chat session"
            )

@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_chat_session(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    db_service: DatabaseService = Depends(get_database_service)
):
    """Delete a chat session and its associated messages."""
    async with request_context() as request_id:
        user_id = current_user.get('id')
        logger.info(f"Deleting session {session_id} for user: {user_id}")

        try:
            session_uuid = await validate_uuid(session_id)
            await get_chat_session(str(session_uuid), current_user, db_service)
            
            await db_service.delete_chat_session(str(session_uuid))
            logger.info(f"Session {session_id} deleted successfully")

        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete chat session"
            )

@router.get(
    "/messages/{session_id}",
    response_model=List[ChatMessageResponse]
)
async def list_chat_messages(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db_service: DatabaseService = Depends(get_database_service)
):
    """List messages in a chat session."""
    async with request_context() as request_id:
        user_id = current_user.get('id')
        logger.info(f"Listing messages for session {session_id}, user: {user_id}")

        try:
            session_uuid = await validate_uuid(session_id)
            await get_chat_session(str(session_uuid), current_user, db_service)
            
            messages = await db_service.list_chat_messages(
                session_id=str(session_uuid),
                limit=limit,
                offset=offset
            )
            logger.info(f"Retrieved {len(messages)} messages for session {session_id}")
            return [ChatMessageResponse(**message) for message in messages]

        except HTTPException as he:
            raise
        except Exception as e:
            logger.error(f"Failed to list messages for session {session_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list chat messages"
            )

@router.post(
    "/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_chat_message(
    message: ChatMessageCreate,
    current_user: Dict = Depends(get_current_user),
    db_service: DatabaseService = Depends(get_database_service)
):
    """Create a new user message in a chat session."""
    async with request_context() as request_id:
        user_id = current_user.get('id')
        logger.info(f"Creating message in session {message.session_id} for user: {user_id}")

        try:
            session = await get_chat_session(str(message.session_id), current_user, db_service)
            
            if message.role != "user":
                logger.warning(f"Invalid role {message.role} for user message")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only 'user' role messages can be created"
                )

            new_message = await db_service.create_chat_message(
                session_id=str(message.session_id),
                project_id=session.get("project_id"),
                user_id=user_id,
                role=message.role,
                content=message.content,
                metadata=message.metadata,
            )
            logger.info(f"Message created successfully in session {message.session_id}")
            return ChatMessageResponse(**new_message)

        except HTTPException as he:
            raise
        except Exception as e:
            logger.error(f"Failed to create message in session {message.session_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create chat message"
            )

@router.post("/completions")
async def create_chat_completion(
    request: ChatCompletionRequest,
    current_user: Dict = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
    db_service: DatabaseService = Depends(get_database_service)
):
    """Generate AI completion for a user message in a session."""
    async with request_context() as request_id:
        user_id = current_user.get('id')
        session_id = str(request.session_id)
        logger.info(f"Processing completion for session {session_id}, user: {user_id}")

        try:
            if not request.messages or not request.messages[-1].content:
                logger.warning("Missing or empty message content in completion request")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Last message must have non-empty content"
                )
            if request.messages[-1].role != "user":
                logger.warning(f"Last message role is {request.messages[-1].role}, expected 'user'")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Last message must be from user"
                )

            session = await get_chat_session(session_id, current_user, db_service)
            if not session:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Chat session not found"
                )

            response_or_generator = await chat_service.process_user_message(
                db_service=db_service,
                session_id=session_id,
                user_id=user_id,
                user_message=request.messages[-1].content,
            )

            if settings.STREAMING_ENABLED:
                if not isinstance(response_or_generator, AsyncGenerator):
                    logger.error(f"Expected AsyncGenerator, got {type(response_or_generator)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Invalid response type for streaming"
                    )

                async def sse_stream():
                    try:
                        async for chunk in response_or_generator:
                            if chunk and chunk.strip():
                                yield f"data: {json.dumps({'content': chunk, 'done': False})}\n\n"
                        yield f"data: {json.dumps({'content': '', 'done': True})}\n\n"
                    except Exception as e:
                        logger.error(f"Streaming error: {str(e)}", exc_info=True)
                        yield f"data: {json.dumps({'error': 'Streaming error', 'done': True})}\n\n"

                logger.info(f"Streaming response for session {session_id}")
                return StreamingResponse(sse_stream(), media_type="text/event-stream")

            else:
                if isinstance(response_or_generator, AsyncGenerator):
                    response = ""
                    async for chunk in response_or_generator:
                        if chunk and chunk.strip():
                            response += chunk
                elif isinstance(response_or_generator, str):
                    response = response_or_generator
                else:
                    logger.error(f"Invalid response type {type(response_or_generator)}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Invalid response type for non-streaming"
                    )

                if not response or not response.strip():
                    logger.warning(f"Empty response generated for session {session_id}")
                    response = "I apologize, but I couldn't generate a proper response. Please try again."

                logger.info(f"Non-streaming response generated for session {session_id}")
                return ChatCompletionResponse(completion=response, session_id=session_id)

        except HTTPException as he:
            raise
        except Exception as e:
            logger.error(f"Failed to process completion for session {session_id}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process chat completion"
            )

async def shutdown_db_service(db_service: DatabaseService = Depends(get_database_service)):
    """Shutdown hook to close DatabaseService HTTP client."""
    await db_service.close()