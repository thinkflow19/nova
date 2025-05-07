from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
import logging
from app.models.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.dependencies import get_current_user
from app.services.database_service import DatabaseService

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/projects",
    tags=["projects"],
)

# Initialize service
db_service = DatabaseService()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate, current_user=Depends(get_current_user)
):
    """Create a new project."""
    try:
        logger.info(
            f"Creating project '{project.name}' for user ID: {current_user['id']}"
        )

        # Call database service to create the project
        created_project = await db_service.create_project(
            name=project.name,
            user_id=current_user["id"],
            description=project.description,
            is_public=project.is_public,
            color=project.color,
            icon=project.icon,
            ai_config=project.ai_config,
            memory_type=project.memory_type,
            tags=project.tags,
        )

        logger.info(f"Project created successfully with ID: {created_project['id']}")
        return created_project
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}",
        )


@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    current_user=Depends(get_current_user),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Get all projects for the current user."""
    try:
        logger.info(f"Listing projects for user ID: {current_user['id']}")

        # Query projects from database
        projects = await db_service.list_projects(
            user_id=current_user["id"], limit=limit, offset=offset
        )

        logger.info(f"Found {len(projects)} projects for user")
        return projects
    except Exception as e:
        logger.error(f"Error listing projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list projects: {str(e)}",
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    """Get a specific project by ID."""
    try:
        logger.info(
            f"Getting project with ID: {project_id} for user ID: {current_user['id']}"
        )

        # Get project from database
        project = await db_service.get_project(project_id)

        # Verify ownership or public access
        if project["user_id"] != current_user["id"] and not project["is_public"]:
            # Check if the user has been granted access through shared_objects
            shared_access = await db_service.execute_custom_query(
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
                    detail="Not authorized to access this project",
                )

        logger.info(f"Project found: {project['name']}")
        return project
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error getting project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project: {str(e)}",
        )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    current_user=Depends(get_current_user),
):
    """Update a project."""
    try:
        logger.info(
            f"Updating project with ID: {project_id} for user ID: {current_user['id']}"
        )

        # First get the project to check ownership
        existing_project = await db_service.get_project(project_id)

        # Verify ownership
        if existing_project["user_id"] != current_user["id"]:
            # Check if the user has write access through shared_objects
            shared_access = await db_service.execute_custom_query(
                table="shared_objects",
                query_params={
                    "select": "*",
                    "filters": {
                        "object_type": "eq.project",
                        "object_id": f"eq.{project_id}",
                        "shared_with": f"eq.{current_user['id']}",
                        "permission_level": "in.(write,admin)",
                    },
                },
            )

            if not shared_access:
                logger.warning(
                    f"User {current_user['id']} not authorized to update project {project_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this project",
                )

        # Prepare update data by converting ProjectUpdate to dict, filtering None values
        update_data = project_update.model_dump(exclude_unset=True)

        # Ensure icon and color are included if present in the update model
        if project_update.icon is not None:
            update_data["icon"] = project_update.icon
        if project_update.color is not None:
            update_data["color"] = project_update.color

        # Update project in database
        updated_project = await db_service.update_project(project_id, update_data)

        logger.info(f"Project updated successfully: {updated_project['name']}")
        return updated_project
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error updating project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}",
        )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    """Delete a project."""
    try:
        logger.info(
            f"Deleting project with ID: {project_id} for user ID: {current_user['id']}"
        )

        # First get the project to check ownership
        existing_project = await db_service.get_project(project_id)

        # Only the owner can delete a project
        if existing_project["user_id"] != current_user["id"]:
            logger.warning(
                f"User {current_user['id']} not authorized to delete project {project_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the project owner can delete a project",
            )

        # Delete project from database
        await db_service.delete_project(project_id)

        logger.info(f"Project {project_id} deleted successfully")
        return None
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error deleting project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete project: {str(e)}",
        )
