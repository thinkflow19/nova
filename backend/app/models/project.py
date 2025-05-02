from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class ToneType(str, Enum):
    FRIENDLY = "friendly"
    FORMAL = "formal"
    TECHNICAL = "technical"
    SUPPORTIVE = "supportive"


class StatusType(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ProjectBase(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=100)
    branding_color: str = Field(
        ..., min_length=4, max_length=9
    )  # HEX colors, e.g., #FFF or #FFFFFF
    tone: str = Field(..., min_length=1, max_length=50)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_name: Optional[str] = Field(None, min_length=1, max_length=100)
    branding_color: Optional[str] = Field(None, min_length=4, max_length=9)
    tone: Optional[str] = Field(None, min_length=1, max_length=50)
    status: Optional[str] = Field(None, min_length=1, max_length=20)


class Project(ProjectBase):
    id: str
    user_id: str
    embed_code: Optional[str] = None
    status: StatusType = StatusType.ACTIVE
    created_at: datetime


class ProjectResponse(ProjectBase):
    id: str
    user_id: str
    status: str
    embed_code: str
    created_at: str

    class Config:
        orm_mode = True
