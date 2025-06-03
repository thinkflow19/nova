from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
import logging
from app.models.projects import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.dependencies import get_current_user
from app.agents.project_agent import ProjectAgent

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"],
)

# Dependency to get ProjectAgent instance
def get_project_agent() -> ProjectAgent:
    return ProjectAgent()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project_endpoint(
    project_data: ProjectCreate, 
    current_user=Depends(get_current_user),
    project_agent: ProjectAgent = Depends(get_project_agent)
):
    """Create a new project via ProjectAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Creating project '{project_data.name}' for user ID: {user_id}")
        created_project = await project_agent.create_project(project_data, user_id)
        logger.info(f"Router: Project created successfully with ID: {created_project.id}")
        return created_project
    except ValueError as ve: # Catch validation or specific errors from agent
        logger.warning(f"Router: Validation error creating project: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error creating project: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}",
        )

@router.get("/", response_model=List[ProjectResponse])
async def list_projects_endpoint(
    current_user=Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000), # Adjusted max limit for flexibility
    offset: int = Query(0, ge=0),
    project_agent: ProjectAgent = Depends(get_project_agent)
):
    """Get all projects for the current user via ProjectAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Listing projects for user ID: {user_id}")
        projects = await project_agent.list_projects_for_user(user_id, limit=limit, offset=offset)
        logger.info(f"Router: Found {len(projects)} projects for user")
        return projects
    except Exception as e:
        logger.error(f"Router: Error listing projects: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list projects: {str(e)}",
        )

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project_endpoint(
    project_id: str, 
    current_user=Depends(get_current_user),
    project_agent: ProjectAgent = Depends(get_project_agent)
):
    """Get a specific project by ID via ProjectAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Getting project with ID: {project_id} for user ID: {user_id}")
        # Agent handles auth check (owner or public/shared)
        project = await project_agent.get_project(project_id, user_id)
        if not project:
            logger.warning(f"Router: Project {project_id} not found or access denied for user {user_id}.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found or access denied."
            )
        logger.info(f"Router: Project found: {project.name}")
        return project
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error getting project {project_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project: {str(e)}",
        )

@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project_endpoint(
    project_id: str,
    project_update_data: ProjectUpdate,
    current_user=Depends(get_current_user),
    project_agent: ProjectAgent = Depends(get_project_agent)
):
    """Update a project via ProjectAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Updating project with ID: {project_id} for user ID: {user_id}")
        
        updated_project = await project_agent.update_project(project_id, project_update_data, user_id)
        
        if not updated_project:
            logger.warning(f"Router: Project {project_id} not found, access denied, or update failed for user {user_id}.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, # Or 403 if specifically auth related
                detail="Project not found, access denied, or update failed."
            )
            
        logger.info(f"Router: Project updated successfully: {updated_project.name}")
        return updated_project
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error updating project {project_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}",
        )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_endpoint(
    project_id: str, 
    current_user=Depends(get_current_user),
    project_agent: ProjectAgent = Depends(get_project_agent)
):
    """Delete a project via ProjectAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Deleting project with ID: {project_id} for user ID: {user_id}")
        
        deleted = await project_agent.delete_project(project_id, user_id)
        
        if not deleted:
            logger.warning(f"Router: Project {project_id} not found or user {user_id} not authorized to delete.")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, # Or 403
                detail="Project not found or user not authorized to delete."
            )
            
        logger.info(f"Router: Project {project_id} delete request processed successfully.")
        # No content returned for 204
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error deleting project {project_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}",
        )
