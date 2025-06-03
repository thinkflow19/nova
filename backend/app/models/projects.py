from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Name of the project")
    description: Optional[str] = Field(None, description="Detailed description of the project")
    is_public: bool = Field(default=False, description="Whether the project is publicly accessible")
    icon: Optional[HttpUrl] = Field(None, description="URL to an icon for the project")
    color: Optional[str] = Field(None, max_length=20, description="A color associated with the project, e.g., hex code")
    ai_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="AI model configurations for the project")
    memory_type: str = Field(default="default", max_length=50, description="Type of memory used for the project's AI")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags for categorizing or searching projects")

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    # All fields are optional for update
    description: Optional[str] = None
    is_public: Optional[bool] = None
    icon: Optional[HttpUrl] = None
    color: Optional[str] = None
    ai_config: Optional[Dict[str, Any]] = None
    memory_type: Optional[str] = None
    tags: Optional[List[str]] = None


class ProjectResponse(ProjectBase):
    id: UUID = Field(description="Unique identifier for the project")
    user_id: UUID = Field(description="Identifier of the user who owns the project")
    created_at: datetime = Field(description="Timestamp of when the project was created")
    updated_at: datetime = Field(description="Timestamp of when the project was last updated")

    class Config:
        orm_mode = True # For compatibility with ORMs, if used
        # Pydantic V2 uses `from_attributes` instead of `orm_mode`
        # from_attributes = True 