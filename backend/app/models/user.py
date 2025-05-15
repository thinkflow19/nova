from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime


class UserProfile(BaseModel):
    """Basic user profile information."""

    user_id: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class UserCreate(BaseModel):
    """Model for creating a new user."""

    email: EmailStr
    password: str = Field(..., min_length=8)
    display_name: Optional[str] = None

    @validator("password")
    def password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        # Additional password validation rules can be added here
        return v


class UserLogin(BaseModel):
    """Model for user login."""

    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Model for updating user profile."""

    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


class UserResponse(BaseModel):
    """Model for user response without sensitive data."""

    id: str
    email: EmailStr
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    role: Optional[str] = "user"
    preferences: Optional[Dict[str, Any]] = None


class TokenResponse(BaseModel):
    """Model for authentication token response."""

    access_token: str
    token_type: str
    user_id: str
    email: EmailStr
    expires_in: int
    refresh_token: Optional[str] = None


class RefreshRequest(BaseModel):
    """Model for token refresh request."""

    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Model for password reset request."""

    email: EmailStr


class NewPasswordRequest(BaseModel):
    """Model for setting new password after reset."""

    token: str
    password: str = Field(..., min_length=8)

    @validator("password")
    def password_strength(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        # Additional password validation rules can be added here
        return v
