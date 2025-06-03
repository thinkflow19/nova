import logging
import uuid
from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import ValidationError
from uuid import UUID

from app.services.dependencies import get_current_user
from app.agents.chat_agent import ChatAgent
from app.models.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
)

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

async def validate_uuid(value: str) -> UUID:
    """Validate UUID format"""
    try:
        return UUID(value)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid UUID format")

def get_chat_agent() -> ChatAgent:
    return ChatAgent()

@router.post(
    "/sessions",
    response_model=ChatSessionResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_chat_session_endpoint(
    session_data: ChatSessionCreate,
    current_user: Dict = Depends(get_current_user),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """Create a new chat session via ChatAgent."""
    logger.info(
        f"Router: Creating chat session for user: {current_user['id']}, project_id: {session_data.project_id}"
    )
    try:
        new_session = await chat_agent.create_session(session_data, current_user['id'])
        logger.info(f"Router: Chat session created successfully: {new_session.id}")
        return new_session
    except ValueError as ve:
        logger.warning(f"Router: Validation error creating session: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error creating session: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat session"
        )

@router.get(
    "/sessions/project/{project_id}",
    response_model=List[ChatSessionResponse]
)
async def list_chat_sessions_for_project_endpoint(
    project_id: str,
    current_user: Dict = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """List chat sessions for a project via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Listing sessions for user: {user_id}, project: {project_id}")
    try:
        project_uuid = await validate_uuid(project_id)
        sessions = await chat_agent.list_sessions_for_project(str(project_uuid), user_id, limit, offset)
        logger.info(f"Router: Retrieved {len(sessions)} sessions for project {project_id}")
        return sessions
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Failed to list sessions for project {project_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list chat sessions for project"
        )

@router.get(
    "/sessions/user",
    response_model=List[ChatSessionResponse]
)
async def list_all_user_sessions_endpoint(
    current_user: Dict = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """List all chat sessions for the current user via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Listing all sessions for user: {user_id}")
    try:
        sessions = await chat_agent.list_sessions_for_user(user_id, limit, offset)
        logger.info(f"Router: Retrieved {len(sessions)} total sessions for user {user_id}")
        return sessions
    except Exception as e:
        logger.error(f"Router: Failed to list all sessions for user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list user chat sessions"
        )

@router.get(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse
)
async def get_chat_session_endpoint(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """Retrieve a specific chat session via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Getting session {session_id} for user: {user_id}")
    try:
        session_uuid = await validate_uuid(session_id)
        session = await chat_agent.get_session(str(session_uuid), user_id)
        if not session:
            logger.warning(f"Router: Session {session_id} not found or access denied for user {user_id}")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found or access denied")
        logger.info(f"Router: Session {session_id} retrieved successfully")
        return session
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Failed to get session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat session"
        )

@router.patch(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse
)
async def update_chat_session_endpoint(
    session_id: str,
    session_update_data: ChatSessionUpdate,
    current_user: Dict = Depends(get_current_user),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """Update a chat session's metadata via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Updating session {session_id} for user: {user_id}")
    try:
        session_uuid = await validate_uuid(session_id)
        
        update_payload = session_update_data.model_dump(exclude_unset=True)
        if not update_payload:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

        updated_session = await chat_agent.update_session(str(session_uuid), update_payload, user_id)
        
        if not updated_session:
            # This could be due to not found, no permission, or actual update failure in DB.
            # Agent logs specifics.
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found, access denied, or update failed.")

        logger.info(f"Router: Session {session_id} updated successfully.")
        return updated_session # This is already a ChatSessionResponse model from agent

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Failed to update session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update chat session"
        )

@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_chat_session_endpoint(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """Delete a chat session via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Deleting session {session_id} for user: {user_id}")
    try:
        session_uuid = await validate_uuid(session_id)
        deleted = await chat_agent.delete_session(str(session_uuid), user_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found or could not be deleted")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Failed to delete session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat session"
        )

@router.get(
    "/sessions/{session_id}/messages",
    response_model=List[ChatMessageResponse]
)
async def list_chat_messages_endpoint(
    session_id: str,
    current_user: Dict = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """List messages in a chat session via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Listing messages for session {session_id}, user: {user_id}")
    try:
        session_uuid = await validate_uuid(session_id)
        messages = await chat_agent.list_messages_for_session(str(session_uuid), user_id, limit, offset)
        logger.info(f"Router: Retrieved {len(messages)} messages for session {session_id}")
        return messages
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Failed to list messages for session {session_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list chat messages"
        )

@router.post(
    "/messages",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_201_CREATED
)
async def add_chat_message_endpoint(
    message_data: ChatMessageCreate,
    current_user: Dict = Depends(get_current_user),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """Add a message to a chat session via ChatAgent. This will also trigger AI response."""
    user_id = current_user.get('id')
    logger.info(f"Router: Adding message to session {message_data.session_id} by user {user_id}")
    
    if not message_data.session_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="session_id is required in the request body.")

    try:
        session_uuid = await validate_uuid(str(message_data.session_id))
        ai_response_message = await chat_agent.add_message_to_session(str(session_uuid), message_data, user_id)
        
        logger.info(f"Router: Message added and AI response generated: {ai_response_message.id}")
        return ai_response_message
    except ValueError as ve:
        logger.warning(f"Router: Validation error adding message: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error adding message to session {message_data.session_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add message to chat session"
        )

@router.get(
    "/messages/{message_id}/details",
    response_model=ChatMessageResponse
)
async def get_chat_message_endpoint(
    message_id: str,
    current_user: Dict = Depends(get_current_user),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """Retrieve a specific chat message by its ID via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Getting message {message_id} for user {user_id}")
    try:
        message_uuid = await validate_uuid(message_id)
        message = await chat_agent.get_message(str(message_uuid), user_id)
        if not message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found or access denied.")
        return message
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error getting message {message_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve message.")

@router.patch(
    "/messages/{message_id}",
    response_model=ChatMessageResponse
)
async def update_chat_message_endpoint(
    message_id: str,
    update_data: ChatMessageCreate,
    current_user: Dict = Depends(get_current_user),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """Update a chat message's content or metadata via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Updating message {message_id} for user {user_id}")
    try:
        message_uuid = await validate_uuid(message_id)
        updated_message = await chat_agent.update_message(
            str(message_uuid), 
            update_data.content,
            user_id,
            update_data.metadata
        )
        if not updated_message:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found, access denied, or update failed.")
        return updated_message
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error updating message {message_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update message.")

@router.delete(
    "/messages/{message_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_chat_message_endpoint(
    message_id: str,
    current_user: Dict = Depends(get_current_user),
    chat_agent: ChatAgent = Depends(get_chat_agent),
):
    """Delete a specific chat message via ChatAgent."""
    user_id = current_user.get('id')
    logger.info(f"Router: Deleting message {message_id} for user {user_id}")
    try:
        message_uuid = await validate_uuid(message_id)
        deleted = await chat_agent.delete_message(str(message_uuid), user_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found or could not be deleted.")
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error deleting message {message_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete message.")