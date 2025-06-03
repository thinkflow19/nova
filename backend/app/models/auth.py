from pydantic import BaseModel, EmailStr, HttpUrl
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime

# Request Models (moved from routers/auth.py)
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordUpdateRequest(BaseModel):
    new_password: str # This is for updating password when user is authenticated

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[HttpUrl] = None # Using HttpUrl for validation
    bio: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    # email: Optional[EmailStr] = None # Email update might require special handling (e.g., re-verification)
    # password: Optional[str] = None # Password should be updated via a dedicated endpoint

# Response Models
class UserProfileResponse(BaseModel):
    id: UUID # This is the user_id from user_profiles, matching auth.users.id
    display_name: Optional[str] = None
    email: Optional[EmailStr] = None # Email is usually present
    avatar_url: Optional[HttpUrl] = None
    bio: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        # from_attributes = True # For Pydantic v2

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    # user: Optional[Dict[str, Any]] # Supabase might return user details, map if needed

class SignUpResponse(BaseModel):
    id: UUID
    email: EmailStr
    message: str 