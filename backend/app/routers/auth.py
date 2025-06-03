from fastapi import APIRouter, HTTPException, status, Depends, Header
from typing import Dict, Any, Optional
import logging

from app.services.dependencies import get_current_user
from app.agents.auth_agent import AuthAgent
from app.models.auth import (
    SignUpRequest, 
    SignInRequest, 
    PasswordResetRequest, 
    PasswordUpdateRequest, 
    RefreshTokenRequest, 
    UserUpdateRequest,
    UserProfileResponse,
    SignUpResponse
)

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)

# Dependency to get AuthAgent instance
def get_auth_agent() -> AuthAgent:
    return AuthAgent()

@router.post("/signup", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
async def sign_up_endpoint(
    request: SignUpRequest,
    auth_agent: AuthAgent = Depends(get_auth_agent)
):
    """Register a new user via AuthAgent."""
    try:
        logger.info(f"Router: Registering new user with email: {request.email}")
        result = await auth_agent.sign_up_user(request)
        logger.info(f"Router: User {result['id']} registered successfully.")
        return result
    except ValueError as ve:
        logger.warning(f"Router: Validation error during signup: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error registering user: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}",
        )

@router.post("/signin")
async def sign_in_endpoint(
    request: SignInRequest,
    auth_agent: AuthAgent = Depends(get_auth_agent)
):
    """Authenticate a user and return tokens via AuthAgent."""
    try:
        logger.info(f"Router: Authenticating user: {request.email}")
        result = await auth_agent.sign_in_user(request)
        logger.info(f"Router: User {request.email} signed in successfully.")
        return result
    except ValueError as ve:
        logger.warning(f"Router: Authentication failed for {request.email}: {ve}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error during authentication: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}",
        )

@router.post("/refresh-token")
@router.post("/refresh")
async def refresh_token_endpoint(
    request: RefreshTokenRequest,
    auth_agent: AuthAgent = Depends(get_auth_agent)
):
    """Refresh the access token using a refresh token via AuthAgent."""
    try:
        logger.info("Router: Processing token refresh request")
        result = await auth_agent.refresh_user_token(request.refresh_token)
        logger.info("Router: Token refreshed successfully.")
        return result
    except ValueError as ve:
        logger.warning(f"Router: Token refresh failed: {ve}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error refreshing token: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh error: {str(e)}",
        )

@router.post("/reset-password")
async def reset_password_endpoint(
    request: PasswordResetRequest,
    auth_agent: AuthAgent = Depends(get_auth_agent)
):
    """Send a password reset email via AuthAgent."""
    try:
        logger.info(f"Router: Processing password reset request for: {request.email}")
        await auth_agent.send_password_reset_email(request.email)
        # Always return success response regardless of actual result for security
        return {
            "message": "If your email is registered, you will receive a password reset link shortly."
        }
    except Exception as e:
        logger.error(f"Router: Error processing password reset: {str(e)}", exc_info=True)
        # Always return success to prevent user enumeration
        return {
            "message": "If your email is registered, you will receive a password reset link shortly."
        }

@router.post("/signout")
async def sign_out_endpoint(
    current_user=Depends(get_current_user),
    auth_agent: AuthAgent = Depends(get_auth_agent),
    authorization: Optional[str] = Header(None)
):
    """Sign out the current user via AuthAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Signing out user: {user_id}")
        
        # Extract token from Authorization header
        access_token = None
        if authorization and authorization.startswith("Bearer "):
            access_token = authorization[7:]  # Remove "Bearer " prefix
        
        if access_token:
            await auth_agent.sign_out_user(access_token)
            logger.info(f"Router: User {user_id} signed out successfully.")
        else:
            logger.warning(f"Router: No access token provided for sign out of user {user_id}. Proceeding anyway.")
            
        return {"success": True, "message": "Successfully signed out"}
    except Exception as e:
        logger.error(f"Router: Error signing out: {str(e)}", exc_info=True)
        # Even if sign out fails on the server side, we should return success for user experience
        return {"success": True, "message": "Successfully signed out"}

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile_endpoint(
    current_user=Depends(get_current_user),
    auth_agent: AuthAgent = Depends(get_auth_agent)
):
    """Get the current user's profile via AuthAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Getting profile for user: {user_id}")
        
        profile = await auth_agent.get_user_profile(user_id)
        if not profile:
            # If no profile exists, we can create one based on current_user data
            logger.warning(f"Router: No profile found for user {user_id}. This might indicate a sync issue.")
            # Return current user data as fallback, but wrapped in UserProfileResponse format
            # Assuming current_user contains the necessary fields, or use default values
            fallback_profile = UserProfileResponse(
                id=user_id,
                display_name=current_user.get('display_name'),
                email=current_user.get('email'),
                avatar_url=current_user.get('avatar_url'),
                bio=current_user.get('bio'),
                preferences=current_user.get('preferences', {}),
                created_at=current_user.get('created_at'),
                updated_at=current_user.get('updated_at')
            )
            return fallback_profile
            
        logger.info(f"Router: Profile retrieved for user {user_id}.")
        return profile
    except Exception as e:
        logger.error(f"Router: Error getting user profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user profile: {str(e)}",
        )

@router.patch("/me", response_model=UserProfileResponse)
async def update_current_user_profile_endpoint(
    request: UserUpdateRequest, 
    current_user=Depends(get_current_user),
    auth_agent: AuthAgent = Depends(get_auth_agent)
):
    """Update the current user's profile via AuthAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Updating profile for user: {user_id}")
        
        updated_profile = await auth_agent.update_user_profile(user_id, request)
        if not updated_profile:
            logger.error(f"Router: Failed to update profile for user {user_id}.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user profile."
            )
            
        logger.info(f"Router: Profile updated successfully for user {user_id}.")
        return updated_profile
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error updating profile: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}",
        )

@router.post("/update-password")
async def update_password_endpoint(
    request: PasswordUpdateRequest,
    current_user=Depends(get_current_user),
    auth_agent: AuthAgent = Depends(get_auth_agent),
    authorization: Optional[str] = Header(None)
):
    """Update the current user's password via AuthAgent."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Updating password for user: {user_id}")
        
        # Extract token from Authorization header
        access_token = None
        if authorization and authorization.startswith("Bearer "):
            access_token = authorization[7:]  # Remove "Bearer " prefix
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token required for password update."
            )
        
        await auth_agent.update_auth_user_password(access_token, request.new_password)
        logger.info(f"Router: Password updated successfully for user {user_id}.")
        
        return {"success": True, "message": "Password updated successfully."}
    except ValueError as ve:
        logger.warning(f"Router: Password update failed for user {current_user['id']}: {ve}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Router: Error updating password: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update password: {str(e)}",
        )
