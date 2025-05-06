from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


class ToneType(str, Enum):
    FRIENDLY = "friendly"
    FORMAL = "formal"
    TECHNICAL = "technical"
    SUPPORTIVE = "supportive"


class StatusType(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: bool = False
    icon: Optional[str] = None
    color: Optional[str] = Field(None, max_length=20)
    ai_config: Optional[Dict[str, Any]] = Field(default_factory=dict)
    memory_type: Optional[str] = Field("default", max_length=50)
    tags: Optional[List[str]] = Field(default_factory=list)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    is_public: Optional[bool] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, max_length=20)
    ai_config: Optional[Dict[str, Any]] = None
    memory_type: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None


class Project(ProjectBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectResponse(ProjectBase):
    id: str
    user_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
