from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from app.models.project import ProjectCreate, ProjectResponse
from app.services.dependencies import get_current_user, MOCK_ADMIN_USER
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
try:
    supabase: Client = create_client(supabase_url, supabase_key)
    print(f"Supabase client initialized with URL: {supabase_url}")
except Exception as e:
    print(f"Error initializing Supabase client: {str(e)}")
    supabase = None
    print("Using fallback mock data for development")

router = APIRouter(
    prefix="/api/project",
    tags=["projects"],
)


@router.post("/create", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate, current_user=Depends(get_current_user)
):
    """Create a new bot project."""
    try:
        print(
            f"Creating project '{project.project_name}' for user ID: {current_user['id']}"
        )

        # Special handling for admin user or when Supabase is unavailable
        if current_user["id"] == MOCK_ADMIN_USER["id"] or supabase is None:
            print("Using mock data for admin user or Supabase unavailable")
            mock_project = {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "project_name": project.project_name,
                "branding_color": project.branding_color,
                "tone": project.tone,
                "embed_code": "<script>console.log('Mock embed code')</script>",
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
            }
            return mock_project

        # Generate embed code
        bot_id = str(uuid.uuid4())
        embed_code = f"""<script>
        window.novaConfig = {{
            botId: '{bot_id}',
            primaryColor: '{project.branding_color}'
        }};
        </script>
        <script src="https://cdn.nova-bot.com/embed.js"></script>
        """

        # Create project in Supabase
        project_data = {
            "id": bot_id,  # Use the same ID for bot and project
            "user_id": current_user["id"],
            "project_name": project.project_name,
            "branding_color": project.branding_color,
            "tone": project.tone,
            "embed_code": embed_code,
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
        }

        print(f"Inserting project data into Supabase: {project_data}")
        response = supabase.table("projects").insert(project_data).execute()

        if not response.data:
            print("No data returned from Supabase insert operation")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create project",
            )

        print(f"Project created successfully with ID: {response.data[0]['id']}")
        return response.data[0]

    except Exception as e:
        print(f"Error creating project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}",
        )


@router.get("/list", response_model=List[ProjectResponse])
async def list_projects(current_user=Depends(get_current_user)):
    """Get all projects for the current user."""
    try:
        print(f"Listing projects for user ID: {current_user['id']}")

        # Special handling for admin user or when Supabase is unavailable
        if current_user["id"] == MOCK_ADMIN_USER["id"] or supabase is None:
            print("Using mock data for admin user or Supabase unavailable")
            return [
                {
                    "id": "mock-1",
                    "user_id": current_user["id"],
                    "project_name": "Demo Bot",
                    "branding_color": "#6366f1",
                    "tone": "friendly",
                    "embed_code": "<script>console.log('Mock embed code')</script>",
                    "status": "active",
                    "created_at": datetime.utcnow().isoformat(),
                }
            ]

        # Query projects from Supabase
        response = (
            supabase.table("projects")
            .select("*")
            .eq("user_id", current_user["id"])
            .execute()
        )

        print(f"Found {len(response.data)} projects for user")

        # If no projects found, return empty list instead of raising error
        if not response.data:
            print("No projects found for user, returning empty list")
            return []

        return response.data

    except Exception as e:
        print(f"Error listing projects: {str(e)}")
        # For development, return mock data if there's an error
        if current_user["id"] == MOCK_ADMIN_USER["id"]:
            print("Error occurred, returning mock data for admin")
            return [
                {
                    "id": "mock-1",
                    "user_id": current_user["id"],
                    "project_name": "Demo Bot (Fallback)",
                    "branding_color": "#6366f1",
                    "tone": "friendly",
                    "embed_code": "<script>console.log('Mock embed code')</script>",
                    "status": "active",
                    "created_at": datetime.utcnow().isoformat(),
                }
            ]
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list projects: {str(e)}",
        )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    """Get a specific project by ID."""
    try:
        print(
            f"Getting project with ID: {project_id} for user ID: {current_user['id']}"
        )

        # Special handling for admin user or when Supabase is unavailable
        if (
            current_user["id"] == MOCK_ADMIN_USER["id"] and project_id == "mock-1"
        ) or supabase is None:
            print("Using mock data for admin user or Supabase unavailable")
            return {
                "id": "mock-1",
                "user_id": current_user["id"],
                "project_name": "Demo Bot",
                "branding_color": "#6366f1",
                "tone": "friendly",
                "embed_code": "<script>console.log('Mock embed code')</script>",
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
            }

        # Query project from Supabase
        response = supabase.table("projects").select("*").eq("id", project_id).execute()

        if not response.data:
            print(f"Project with ID {project_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        project = response.data[0]

        # Verify ownership
        if project["user_id"] != current_user["id"]:
            print(
                f"User {current_user['id']} not authorized to access project {project_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this project",
            )

        print(f"Project found: {project['project_name']}")
        return project

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Error getting project: {str(e)}")
        # For development, return mock data if there's an error for an admin user
        if current_user["id"] == MOCK_ADMIN_USER["id"] and project_id == "mock-1":
            return {
                "id": "mock-1",
                "user_id": current_user["id"],
                "project_name": "Demo Bot (Fallback)",
                "branding_color": "#6366f1",
                "tone": "friendly",
                "embed_code": "<script>console.log('Mock embed code')</script>",
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
            }
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get project: {str(e)}",
        )


@router.put("/{project_id}/update", response_model=ProjectResponse)
async def update_project(
    project_id: str, project: ProjectCreate, current_user=Depends(get_current_user)
):
    """Update a project."""
    try:
        print(
            f"Updating project with ID: {project_id} for user ID: {current_user['id']}"
        )

        # Special handling for admin user or when Supabase is unavailable
        if (
            current_user["id"] == MOCK_ADMIN_USER["id"] and project_id == "mock-1"
        ) or supabase is None:
            print("Using mock data for admin user or Supabase unavailable")
            return {
                "id": "mock-1",
                "user_id": current_user["id"],
                "project_name": project.project_name,
                "branding_color": project.branding_color,
                "tone": project.tone,
                "embed_code": "<script>console.log('Updated mock embed code')</script>",
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
            }

        # Verify project exists and user has ownership
        response = supabase.table("projects").select("*").eq("id", project_id).execute()

        if not response.data:
            print(f"Project with ID {project_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        existing_project = response.data[0]
        if existing_project["user_id"] != current_user["id"]:
            print(
                f"User {current_user['id']} not authorized to update project {project_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this project",
            )

        # Update project
        project_data = {
            "project_name": project.project_name,
            "branding_color": project.branding_color,
            "tone": project.tone,
        }

        print(f"Updating project with data: {project_data}")
        response = (
            supabase.table("projects")
            .update(project_data)
            .eq("id", project_id)
            .execute()
        )

        print(f"Project updated successfully: {response.data[0]['project_name']}")
        return response.data[0]

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Error updating project: {str(e)}")
        # For development, return mock data if there's an error for an admin user
        if current_user["id"] == MOCK_ADMIN_USER["id"] and project_id == "mock-1":
            return {
                "id": "mock-1",
                "user_id": current_user["id"],
                "project_name": project.project_name,
                "branding_color": project.branding_color,
                "tone": project.tone,
                "embed_code": "<script>console.log('Updated mock embed code')</script>",
                "status": "active",
                "created_at": datetime.utcnow().isoformat(),
            }
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update project: {str(e)}",
        )
