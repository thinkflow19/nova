from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class PlanType(str, Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserDB(UserBase):
    id: str
    plan: PlanType = PlanType.FREE
    created_at: datetime


class UserResponse(UserBase):
    id: str
    plan: PlanType
    created_at: str  # Changed to string for easier serialization

    class Config:
        from_attributes = True
