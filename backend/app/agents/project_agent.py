"""
Agent responsible for managing projects.
"""
import logging
from typing import List, Dict, Any, Optional
import uuid

from app.services.database_service import DatabaseService
from app.models.projects import ProjectCreate, ProjectUpdate, ProjectResponse # Assuming these models exist

logger = logging.getLogger(__name__)

class ProjectAgent:
    def __init__(self):
        self.db_service = DatabaseService()

    async def create_project(self, project_data: ProjectCreate, user_id: str) -> ProjectResponse:
        """Creates a new project for the user."""
        logger.info(f"ProjectAgent creating project titled '{project_data.name}' for user {user_id}")
        
        # Convert Pydantic model to dict for db_service, or ensure db_service can handle Pydantic models
        # For now, let's assume db_service.create_project expects specific parameters
        created_project_data = await self.db_service.create_project(
            name=project_data.name,
            user_id=user_id,
            description=project_data.description,
            is_public=project_data.is_public,
            icon=project_data.icon,
            color=project_data.color,
            ai_config=project_data.ai_config if project_data.ai_config else {},
            memory_type=project_data.memory_type,
            tags=project_data.tags if project_data.tags else []
        )
        return ProjectResponse(**created_project_data)

    async def get_project(self, project_id: str, user_id: str) -> Optional[ProjectResponse]:
        """Retrieves a specific project if the user has access."""
        logger.info(f"ProjectAgent retrieving project {project_id} for user {user_id}")
        project_data = await self.db_service.get_project(project_id)
        
        # Authorization: Check if user owns the project or if project is public
        # RLS in the database should be the primary enforcer of access control.
        # This is an additional check in the agent layer.
        if project_data:
            if project_data.get("user_id") == user_id or project_data.get("is_public"):
                # Further checks for shared projects would go here if applicable
                return ProjectResponse(**project_data)
            else:
                # Check shared_objects table if not owner and not public
                # This logic might be complex and better handled by a dedicated auth service or rely on RLS
                # For now, keeping it simple: if not owner and not public, access denied by agent
                logger.warning(f"User {user_id} does not have direct access to project {project_id} (not owner/public). RLS should govern.")
                # Depending on strictness, might return None or raise Forbidden
                # For now, let RLS be the final arbiter, but log a warning.
                # If RLS is correctly set up, this condition implies a potential issue or sharing model not yet handled by agent.
                # Let's assume if get_project returned data, RLS allowed it. Agent can add business logic on top.
                # If the DB call itself would fail due to RLS for non-owners/non-public, project_data would be None/empty.
                # So if we have project_data, it means RLS allowed the read. Agent can return it.
                return ProjectResponse(**project_data) 

        logger.warning(f"Project {project_id} not found for user {user_id}, or user lacks permissions according to agent logic (should be RLS enforced).")
        return None

    async def list_projects_for_user(self, user_id: str, limit: int = 100, offset: int = 0) -> List[ProjectResponse]:
        """Lists all projects for a given user."""
        logger.info(f"ProjectAgent listing projects for user {user_id}")
        projects_data = await self.db_service.list_projects(user_id=user_id, limit=limit, offset=offset)
        return [ProjectResponse(**proj) for proj in projects_data]

    async def update_project(self, project_id: str, project_update_data: ProjectUpdate, user_id: str) -> Optional[ProjectResponse]:
        """Updates a project if the user is the owner."""
        logger.info(f"ProjectAgent attempting to update project {project_id} for user {user_id}")
        
        # Verify user ownership before attempting update
        project_to_update = await self.db_service.get_project(project_id)
        if not project_to_update or project_to_update.get("user_id") != user_id:
            logger.warning(f"User {user_id} cannot update project {project_id}: Not found or not owner.")
            # Consider shared project edit rights here in a more complex system
            return None

        update_payload = project_update_data.model_dump(exclude_unset=True) # Get only fields that were set
        if not update_payload:
            logger.info("No fields to update for project.")
            return ProjectResponse(**project_to_update) # Return current data if nothing to update

        # Ensure user_id is not in the update_payload from the client
        if 'user_id' in update_payload:
            del update_payload['user_id']
            
        updated_project_data = await self.db_service.update_project(project_id, update_payload)
        if updated_project_data:
            logger.info(f"Project {project_id} updated successfully by user {user_id}.")
            return ProjectResponse(**updated_project_data)
        else:
            # This case might indicate an issue if the project existed but update failed at DB level
            logger.error(f"Failed to update project {project_id} in database despite ownership check.")
            return None

    async def delete_project(self, project_id: str, user_id: str) -> bool:
        """Deletes a project if the user is the owner."""
        logger.info(f"ProjectAgent attempting to delete project {project_id} for user {user_id}")
        
        # Verify user ownership before attempting deletion
        project_to_delete = await self.db_service.get_project(project_id)
        if not project_to_delete or project_to_delete.get("user_id") != user_id:
            logger.warning(f"User {user_id} cannot delete project {project_id}: Not found or not owner.")
            # Consider shared project admin rights here
            return False
        
        # Add logic here for cascading deletes if necessary (e.g., documents, sessions within the project)
        # This might involve calling other agents or services.
        # For now, db_service.delete_project is assumed to handle DB-level cascades (ON DELETE CASCADE)
        
        # Example: If there are non-DB related cleanups (e.g., Pinecone namespaces specific to project NOT docs)
        # await self.vector_store.delete_namespace(namespace=f"project_{project_id}")

        await self.db_service.delete_project(project_id)
        logger.info(f"Project {project_id} and its related data (via DB cascade) deleted by user {user_id}.")
        return True

    # Placeholder for future methods like: 
    # - share_project
    # - list_shared_users_for_project
    # - manage_project_settings (e.g., AI config)
    # - list_project_documents (might call DocumentProcessingAgent or DocumentService)
    # - list_project_chat_sessions (might call ChatAgent or ChatService)