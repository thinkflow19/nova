import uuid
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional

from app.services.database_service import DatabaseService
from app.utils.auth import get_user_id, TokenData

router = APIRouter()

# Create a database service instance
db_service = DatabaseService()

# Define the data model for Project
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False
    # user_id is now set automatically from the token

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    # user_id cannot be updated directly

class Project(ProjectBase):
    id: str
    user_id: str # Make user_id non-optional in the response
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True # Kept for potential compatibility, but FastAPI uses model_config now
        # For Pydantic v2, use model_config
        # model_config = {"from_attributes": True}

# Dependency for project authorization
async def get_project_owner(project_id: str, current_user_id: str = Depends(get_user_id)):
    try:
        project = db_service.get_project(project_id)
        if project['user_id'] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this project"
            )
        return project
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Project not found: {project_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error verifying project ownership: {str(e)}")

@router.post("/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, current_user_id: str = Depends(get_user_id)):
    """
    Create a new project for the authenticated user.
    """
    try:
        created_project = db_service.create_project(
            name=project.name,
            description=project.description,
            user_id=current_user_id, # Set user_id from token
            is_public=project.is_public
        )
        return created_project
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create project: {str(e)}")

@router.get("/projects/{project_id}", response_model=Project)
async def get_project(project: dict = Depends(get_project_owner)):
    """
    Get a project by ID, ensuring the requester is the owner.
    """
    # The get_project_owner dependency already fetches and authorizes the project
    return project

@router.get("/projects", response_model=List[Project])
async def list_projects(current_user_id: str = Depends(get_user_id), limit: int = 100, offset: int = 0):
    """
    List projects for the authenticated user.
    """
    try:
        # Pass the authenticated user_id to filter projects
        projects = db_service.list_projects(user_id=current_user_id, limit=limit, offset=offset)
        return projects
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to list projects: {str(e)}")

@router.patch("/projects/{project_id}", response_model=Project)
async def update_project(project_update: ProjectUpdate, project: dict = Depends(get_project_owner)):
    """
    Update a project owned by the authenticated user.
    """
    project_id = project['id']
    try:
        update_data = {k: v for k, v in project_update.model_dump(exclude_unset=True).items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No valid update fields provided")
        
        # Ensure user_id is not being updated
        if 'user_id' in update_data:
            del update_data['user_id']
            
        updated_project = db_service.update_project(project_id, update_data)
        return updated_project
    except Exception as e:
        # Not found is handled by get_project_owner
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update project: {str(e)}")

@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project: dict = Depends(get_project_owner)):
    """
    Delete a project owned by the authenticated user.
    """
    project_id = project['id']
    try:
        db_service.delete_project(project_id)
        # Return None or an empty response for 204
        return None
    except Exception as e:
        # Not found is handled by get_project_owner
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete project: {str(e)}") 