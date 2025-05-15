from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import Dict, Any, Optional
import logging
import os
import httpx
from pydantic import BaseModel, EmailStr

from app.services.dependencies import get_current_user
from app.services.database_service import DatabaseService

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Initialize the database service for user profile operations
db_service = DatabaseService()


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
    new_password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserUpdateRequest(BaseModel):
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def sign_up(request: SignUpRequest):
    """
    Register a new user.

    This endpoint:
    1. Creates a new user in Supabase Auth
    2. Creates a profile record in the user_profiles table
    """
    try:
        logger.info(f"Registering new user with email: {request.email}")

        # Create user in Auth
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/signup",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "email": request.email,
                    "password": request.password,
                    "data": {
                        "display_name": request.display_name,
                        **(request.metadata or {}),
                    },
                },
            )

            if response.status_code != 200:
                logger.error(
                    f"Error creating user: {response.status_code} - {response.text}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create user: {response.json().get('msg', 'Unknown error')}",
                )

            auth_data = response.json()
            user_id = auth_data.get("user", {}).get("id")

            # Create user profile
            if user_id:
                try:
                    profile = db_service.create_user_profile(
                        user_id=user_id,
                        display_name=request.display_name
                        or auth_data.get("user", {}).get("email", "").split("@")[0],
                        avatar_url=None,
                        bio=None,
                        preferences={},
                    )
                    logger.info(f"Created profile for user {user_id}")
                except Exception as e:
                    logger.error(f"Error creating user profile: {str(e)}")
                    # We still want to return success even if profile creation fails
                    # as the user was created in auth

            # Return auth data
            return {
                "id": user_id,
                "email": request.email,
                "message": "Registration successful. Please check your email to confirm your account.",
            }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error registering user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}",
        )


@router.post("/signin")
async def sign_in(request: SignInRequest):
    """
    Authenticate a user and return tokens.
    """
    try:
        logger.info(f"Authenticating user: {request.email}")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token",
                params={"grant_type": "password"},
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                json={"email": request.email, "password": request.password},
            )

            if response.status_code != 200:
                logger.error(
                    f"Authentication failed: {response.status_code} - {response.text}"
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password",
                )

            # Return Supabase auth data
            return response.json()

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error during authentication: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}",
        )


@router.post("/refresh-token")
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh the access token using a refresh token.
    """
    try:
        logger.info("Processing token refresh request")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token",
                params={"grant_type": "refresh_token"},
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                json={"refresh_token": request.refresh_token},
            )

            if response.status_code != 200:
                logger.error(
                    f"Token refresh failed: {response.status_code} - {response.text}"
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired refresh token",
                )

            # Return new tokens
            return response.json()

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error refreshing token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh error: {str(e)}",
        )


@router.post("/reset-password")
async def reset_password(request: PasswordResetRequest):
    """
    Send a password reset email.
    """
    try:
        logger.info(f"Sending password reset email to: {request.email}")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/auth/v1/recover",
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": "application/json",
                },
                json={"email": request.email},
            )

            if response.status_code != 200:
                logger.error(
                    f"Password reset request failed: {response.status_code} - {response.text}"
                )
                # Always return success to prevent email enumeration

            # Always return success response regardless of actual result
            # This is a security best practice to prevent user enumeration
            return {
                "message": "If your email is registered, you will receive a password reset link shortly."
            }

    except Exception as e:
        logger.error(f"Error processing password reset: {str(e)}")
        # Always return success to prevent user enumeration
        return {
            "message": "If your email is registered, you will receive a password reset link shortly."
        }


@router.post("/signout")
async def sign_out(current_user=Depends(get_current_user)):
    """
    Sign out the current user.
    """
    try:
        logger.info(f"Signing out user: {current_user['id']}")

        return {"success": True, "message": "Successfully signed out"}

    except Exception as e:
        logger.error(f"Error signing out: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error signing out: {str(e)}",
        )


@router.get("/me")
async def get_current_user_profile(current_user=Depends(get_current_user)):
    """
    Get the current user's profile.
    """
    return current_user


@router.patch("/me")
async def update_current_user_profile(
    request: UserUpdateRequest, current_user=Depends(get_current_user)
):
    """
    Update the current user's profile.
    """
    try:
        logger.info(f"Updating profile for user: {current_user['id']}")

        # Get update data
        update_data = request.dict(exclude_unset=True)

        if not update_data:
            return current_user

        # Update profile
        updated_profile = db_service.update_user_profile(
            user_id=current_user["id"], update_data=update_data
        )

        # Merge with current user data
        updated_user = {**current_user}
        if updated_profile:
            for key, value in update_data.items():
                updated_user[key] = value

        return updated_user

    except Exception as e:
        logger.error(f"Error updating profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}",
        )
