"""
Agent responsible for managing chat sessions and messages.
"""
import logging
from typing import List, Dict, Any, Optional
import uuid

from app.services.database_service import DatabaseService
from app.services.vector_store_service import get_vector_store_service # For RAG later
from app.services.embedding_service import get_embedding_service # For RAG later
# Assuming an LLM service will be available or integrated later
# from app.services.llm_service import get_llm_service 
from app.models.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSession,
    ChatMessage
)

logger = logging.getLogger(__name__)

class ChatAgent:
    def __init__(self):
        self.db_service = DatabaseService()
        # self.vector_store = get_vector_store_service()
        # self.embedding_service = get_embedding_service()
        # self.llm_service = get_llm_service() # Placeholder for LLM interaction

    async def create_session(self, session_data: ChatSessionCreate, user_id: str) -> ChatSessionResponse:
        """Creates a new chat session."""
        logger.info(f"ChatAgent creating session for user {user_id} in project {session_data.project_id}")
        # project_id is optional in ChatSessionCreate, handle accordingly
        created_session_data = await self.db_service.create_chat_session(
            project_id=str(session_data.project_id) if session_data.project_id else None,
            user_id=user_id,
            title=session_data.title,
            ai_config=session_data.ai_config if session_data.ai_config else {}
        )
        
        # Convert datetime fields to strings for the response model
        response_data = {
            "id": str(created_session_data["id"]),
            "project_id": str(created_session_data["project_id"]),
            "user_id": str(created_session_data["user_id"]),
            "title": created_session_data.get("title"),
            "summary": created_session_data.get("summary"),
            "is_pinned": created_session_data.get("is_pinned", False),
            "ai_config": created_session_data.get("ai_config", {}),
            "created_at": created_session_data["created_at"].isoformat() if hasattr(created_session_data["created_at"], 'isoformat') else str(created_session_data["created_at"]),
            "updated_at": created_session_data["updated_at"].isoformat() if hasattr(created_session_data["updated_at"], 'isoformat') else str(created_session_data["updated_at"])
        }
        
        return ChatSessionResponse(**response_data)

    async def get_session(self, session_id: str, user_id: str) -> Optional[ChatSessionResponse]:
        """Retrieves a specific chat session if the user has access."""
        logger.info(f"ChatAgent retrieving session {session_id} for user {user_id}")
        session_data = await self.db_service.get_chat_session(session_id)
        # Basic ownership check, RLS policies in DB should enforce further access control
        if session_data and session_data.get("user_id") == user_id:
            # Convert datetime fields to strings for the response model
            response_data = {
                "id": str(session_data["id"]),
                "project_id": str(session_data["project_id"]),
                "user_id": str(session_data["user_id"]),
                "title": session_data.get("title"),
                "summary": session_data.get("summary"),
                "is_pinned": session_data.get("is_pinned", False),
                "ai_config": session_data.get("ai_config", {}),
                "created_at": session_data["created_at"].isoformat() if hasattr(session_data["created_at"], 'isoformat') else str(session_data["created_at"]),
                "updated_at": session_data["updated_at"].isoformat() if hasattr(session_data["updated_at"], 'isoformat') else str(session_data["updated_at"])
            }
            return ChatSessionResponse(**response_data)
        logger.warning(f"User {user_id} attempted to access session {session_id} without permission or session not found.")
        return None

    async def list_sessions_for_project(self, project_id: str, user_id: str, limit: int = 100, offset: int = 0) -> List[ChatSessionResponse]:
        """Lists chat sessions for a given project if the user has access."""
        logger.info(f"ChatAgent listing sessions for project {project_id}, user {user_id}")
        # First, verify user has access to the project (simplified check here)
        project = await self.db_service.get_project(project_id)
        if not project or (project.get("user_id") != user_id and not project.get("is_public")):
            # More sophisticated shared project access check would be needed here or rely on RLS
            logger.warning(f"User {user_id} does not have access to project {project_id}.")
            return []
        
        sessions_data = await self.db_service.list_chat_sessions(user_id=user_id, project_id=project_id, limit=limit, offset=offset)
        
        # Convert each session to ChatSessionResponse
        response_sessions = []
        for session in sessions_data:
            response_data = {
                "id": str(session["id"]),
                "project_id": str(session["project_id"]),
                "user_id": str(session["user_id"]),
                "title": session.get("title"),
                "summary": session.get("summary"),
                "is_pinned": session.get("is_pinned", False),
                "ai_config": session.get("ai_config", {}),
                "created_at": session["created_at"].isoformat() if hasattr(session["created_at"], 'isoformat') else str(session["created_at"]),
                "updated_at": session["updated_at"].isoformat() if hasattr(session["updated_at"], 'isoformat') else str(session["updated_at"])
            }
            response_sessions.append(ChatSessionResponse(**response_data))
        
        return response_sessions

    async def list_sessions_for_user(self, user_id: str, limit: int = 100, offset: int = 0) -> List[ChatSessionResponse]:
        """Lists all chat sessions for a user across all their projects."""
        logger.info(f"ChatAgent listing all sessions for user {user_id}")
        sessions_data = await self.db_service.list_chat_sessions(user_id=user_id, limit=limit, offset=offset)
        
        # Convert each session to ChatSessionResponse
        response_sessions = []
        for session in sessions_data:
            response_data = {
                "id": str(session["id"]),
                "project_id": str(session["project_id"]),
                "user_id": str(session["user_id"]),
                "title": session.get("title"),
                "summary": session.get("summary"),
                "is_pinned": session.get("is_pinned", False),
                "ai_config": session.get("ai_config", {}),
                "created_at": session["created_at"].isoformat() if hasattr(session["created_at"], 'isoformat') else str(session["created_at"]),
                "updated_at": session["updated_at"].isoformat() if hasattr(session["updated_at"], 'isoformat') else str(session["updated_at"])
            }
            response_sessions.append(ChatSessionResponse(**response_data))
        
        return response_sessions

    async def update_session(self, session_id: str, session_update_data: Dict[str, Any], user_id: str) -> Optional[ChatSessionResponse]:
        """Updates a chat session if the user has access (owner)."""
        logger.info(f"ChatAgent attempting to update session {session_id} for user {user_id}")
        # First, ensure the user owns the session they are trying to update.
        session = await self.get_session(session_id, user_id)
        if not session:
            logger.warning(f"User {user_id} cannot update session {session_id}: Not found or no access.")
            return None

        # User has access, proceed with update
        # Filter out fields that should not be updated directly by user (e.g., user_id, project_id)
        allowed_update_fields = ["title", "summary", "ai_config", "is_pinned"]
        update_payload = {k: v for k, v in session_update_data.items() if k in allowed_update_fields and v is not None}

        if not update_payload:
            logger.info(f"No valid fields to update for session {session_id}. Returning current session data.")
            return session # Return current session if no valid update data

        updated_session_data = await self.db_service.update_chat_session(session_id, update_payload)
        if updated_session_data:
            logger.info(f"Session {session_id} updated successfully by user {user_id}.")
            # Convert datetime fields to strings for the response model
            response_data = {
                "id": str(updated_session_data["id"]),
                "project_id": str(updated_session_data["project_id"]),
                "user_id": str(updated_session_data["user_id"]),
                "title": updated_session_data.get("title"),
                "summary": updated_session_data.get("summary"),
                "is_pinned": updated_session_data.get("is_pinned", False),
                "ai_config": updated_session_data.get("ai_config", {}),
                "created_at": updated_session_data["created_at"].isoformat() if hasattr(updated_session_data["created_at"], 'isoformat') else str(updated_session_data["created_at"]),
                "updated_at": updated_session_data["updated_at"].isoformat() if hasattr(updated_session_data["updated_at"], 'isoformat') else str(updated_session_data["updated_at"])
            }
            return ChatSessionResponse(**response_data)
        else:
            logger.error(f"Failed to update session {session_id} in database even after access check.")
            return None

    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """Deletes a chat session if the user is the owner."""
        logger.info(f"ChatAgent attempting to delete session {session_id} for user {user_id}")
        session_data = await self.db_service.get_chat_session(session_id)
        if session_data and session_data.get("user_id") == user_id:
            await self.db_service.delete_chat_session(session_id)
            logger.info(f"Session {session_id} deleted by user {user_id}.")
            return True
        logger.warning(f"User {user_id} failed to delete session {session_id} (not found or not owner).")
        return False

    async def add_message_to_session(self, session_id: str, message_data: ChatMessageCreate, user_id: str) -> ChatMessage:
        """Adds a message to a chat session and potentially gets a response from an AI."""
        logger.info(f"ChatAgent adding message to session {session_id} by user {user_id}")
        
        # Verify user has access to the session
        session = await self.get_session(session_id, user_id)
        if not session:
            raise ValueError("Session not found or access denied.")

        # Store the user's message
        user_message_db = await self.db_service.create_chat_message(
            session_id=session_id,
            project_id=str(session.project_id) if session.project_id else None,
            user_id=user_id,
            role=message_data.role,
            content=message_data.content,
            metadata=message_data.metadata
        )
        logger.info(f"User message {user_message_db['id']} stored.")

        # --- Placeholder for RAG and LLM interaction ---
        # If the message is from a 'user', the agent might:
        # 1. Perform RAG using self.vector_store and self.embedding_service
        #    based on message_data.content and session.project_id
        # 2. Construct a prompt with context from RAG.
        # 3. Call self.llm_service.generate_response(prompt)
        # 4. Store the assistant's response.
        
        # For now, we'll just return the user's message. 
        # Actual assistant response generation would be more complex.
        
        # Example: Simulate assistant response for demonstration
        if message_data.role == "user":
            # This is where RAG/LLM logic would go
            assistant_content = f"Echo: {message_data.content}" # Simple echo for now
            assistant_message_db = await self.db_service.create_chat_message(
                session_id=session_id,
                project_id=str(session.project_id) if session.project_id else None,
                user_id=user_id, # Or a dedicated AI user ID
                role="assistant",
                content=assistant_content,
                metadata={"source": "ChatAgent placeholder"}
            )
            logger.info(f"Placeholder assistant message {assistant_message_db['id']} stored.")
            # Typically, you'd return the assistant's message here or both.
            # For this example, let's return the user's processed message.
            return ChatMessage(**assistant_message_db) 
            
        return ChatMessage(**user_message_db)

    async def list_messages_for_session(self, session_id: str, user_id: str, limit: int = 100, offset: int = 0) -> List[ChatMessage]:
        """Lists messages for a given session if the user has access."""
        logger.info(f"ChatAgent listing messages for session {session_id}, user {user_id}")
        session = await self.get_session(session_id, user_id)
        if not session:
            logger.warning(f"User {user_id} does not have access to session {session_id} for listing messages.")
            return []
            
        messages_data = await self.db_service.list_chat_messages(session_id=session_id, limit=limit, offset=offset)
        return [ChatMessage(**msg) for msg in messages_data]

    async def regenerate_response(self, session_id: str, message_id: str, user_id: str) -> Optional[ChatMessage]:
        """ Regenerates an assistant's response for a given message. """
        # This would involve: 
        # 1. Fetching the conversation history up to the message BEFORE the one to regenerate.
        # 2. Identifying the user prompt that led to the assistant message `message_id`.
        # 3. Performing RAG and LLM call again.
        # 4. Updating the existing assistant message `message_id` or creating a new one.
        logger.info(f"ChatAgent received request to regenerate response for message {message_id} in session {session_id}")
        # Placeholder: actual implementation requires more complex logic
        # For now, let's assume we find the original user message and simulate a new response.
        # This is highly simplified.
        original_assistant_message = await self.db_service.get_chat_message(message_id) # You'll need get_chat_message in db_service
        if not original_assistant_message or original_assistant_message.get('role') != 'assistant':
            logger.error(f"Cannot regenerate: Message {message_id} is not an assistant message.")
            return None
        
        # Hypothetically, find the preceding user message
        # messages = await self.list_messages_for_session(session_id, user_id, limit=1000) # Get all messages
        # user_prompt_content = "... find previous user message ..."

        # Simulate new response
        new_assistant_content = f"Regenerated echo: (original id {message_id})"
        # Update existing message or create new one logic here
        updated_message = await self.db_service.update_chat_message(message_id, {"content": new_assistant_content, "metadata": {"regenerated_at": "now"}}) # update_chat_message needed
        return ChatMessage(**updated_message) if updated_message else None

    async def get_message(self, message_id: str, user_id: str) -> Optional[ChatMessage]:
        """Retrieves a specific message if the user has access via session ownership."""
        logger.info(f"ChatAgent retrieving message {message_id} for user {user_id}")
        # This requires ensuring the user has access to the session the message belongs to.
        # A direct db_service.get_chat_message might not be secure enough without session check.
        # For now, assume RLS handles it or add session check here.
        message_data = await self.db_service.get_chat_message(message_id) # get_chat_message to be added to db_service
        if message_data:
            session = await self.get_session(message_data['session_id'], user_id)
            if session: # If user has access to the session, they have access to the message
                 return ChatMessage(**message_data)
        return None

    async def update_message(self, message_id: str, content: str, user_id: str, metadata: Optional[Dict[str, Any]] = None) -> Optional[ChatMessage]:
        """Updates a message if the user is the owner of the message (or session)."""
        logger.info(f"ChatAgent updating message {message_id} by user {user_id}")
        message_to_update = await self.get_message(message_id, user_id) # Leverages session access check
        if not message_to_update or message_to_update.user_id != uuid.UUID(user_id):
             logger.warning(f"User {user_id} cannot update message {message_id}.")
             return None
        
        update_payload = {"content": content}
        if metadata:
            update_payload["metadata"] = metadata # Or merge with existing
        
        updated_message_data = await self.db_service.update_chat_message(message_id, update_payload)
        return ChatMessage(**updated_message_data) if updated_message_data else None

    async def delete_message(self, message_id: str, user_id: str) -> bool:
        """Deletes a message if the user is the owner."""
        logger.info(f"ChatAgent deleting message {message_id} by user {user_id}")
        message_to_delete = await self.get_message(message_id, user_id) # Leverages session access check
        if not message_to_delete or message_to_delete.user_id != uuid.UUID(user_id):
            logger.warning(f"User {user_id} cannot delete message {message_id}.")
            return False
        
        await self.db_service.delete_chat_message(message_id) # delete_chat_message to be added to db_service
        return True 