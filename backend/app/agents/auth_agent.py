"""
Agent responsible for authentication and user management.
"""
import logging
import os
import httpx
from typing import Dict, Any, Optional
from pydantic import EmailStr # For type hinting

from app.services.database_service import DatabaseService
# Pydantic models will be passed from the router, or defined here if specific to agent logic
from app.models.auth import SignUpRequest, SignInRequest, UserProfileResponse, UserUpdateRequest # Assuming these exist

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # For admin actions if any

class AuthAgent:
    def __init__(self):
        self.db_service = DatabaseService()
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            logger.error("Supabase URL or Anon Key not configured. Auth functionalities will fail.")
            # Consider raising an exception here to prevent agent instantiation without proper config

    async def _make_supabase_auth_request(self, method: str, endpoint: str, json_data: Optional[Dict] = None, params: Optional[Dict] = None, headers: Optional[Dict] = None) -> httpx.Response:
        """Helper function to make requests to Supabase Auth."""
        if not SUPABASE_URL or not SUPABASE_ANON_KEY:
            raise ValueError("SupABASE_URL and SUPABASE_ANON_KEY must be set.")

        base_headers = {"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"}
        if headers:
            base_headers.update(headers)

        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(method, f"{SUPABASE_URL}/auth/v1/{endpoint}", json=json_data, params=params, headers=base_headers)
                return response
            except httpx.RequestError as e:
                logger.error(f"HTTP request to Supabase Auth failed: {e}")
                raise ValueError(f"Error connecting to authentication service: {e}") # Re-raise as a general error

    async def sign_up_user(self, signup_data: SignUpRequest) -> Dict[str, Any]:
        """Registers a new user with Supabase Auth and creates a local profile."""
        logger.info(f"AuthAgent: Attempting to sign up user {signup_data.email}")
        
        auth_payload = {
            "email": signup_data.email,
            "password": signup_data.password,
            "data": {
                "display_name": signup_data.display_name,
                **(signup_data.metadata or {}),
            },
        }
        response = await self._make_supabase_auth_request("POST", "signup", json_data=auth_payload)

        if response.status_code != 200: # Supabase signup returns 200 on success
            logger.error(f"AuthAgent: Supabase signup failed for {signup_data.email}. Status: {response.status_code}, Response: {response.text}")
            error_detail = response.json().get('msg', 'Supabase signup failed')
            raise ValueError(f"Registration failed: {error_detail}")

        auth_response_data = response.json()
        user_id = auth_response_data.get("user", {}).get("id")

        if not user_id:
            logger.error(f"AuthAgent: Supabase signup for {signup_data.email} succeeded but no user ID returned. Response: {auth_response_data}")
            raise ValueError("Registration succeeded but failed to retrieve user ID.")

        logger.info(f"AuthAgent: User {user_id} created in Supabase Auth for email {signup_data.email}")

        # Create user profile in local DB
        try:
            await self.db_service.create_user_profile(
                user_id=user_id,
                display_name=signup_data.display_name or signup_data.email.split("@")[0],
                # avatar_url, bio, preferences can be added/updated later via profile update
            )
            logger.info(f"AuthAgent: User profile created for {user_id}")
        except Exception as e:
            logger.error(f"AuthAgent: Failed to create local user profile for {user_id} after Supabase signup. Error: {e}. Proceeding since auth user exists.")
            # Decide on error handling: raise, or just log and continue?
            # For now, log and continue as primary user creation was successful.

        return {
            "id": user_id,
            "email": signup_data.email,
            "message": "Registration successful. Please check your email to confirm your account.",
            # Potentially include parts of auth_response_data if needed by frontend immediately
        }

    async def sign_in_user(self, signin_data: SignInRequest) -> Dict[str, Any]:
        """Authenticates a user with Supabase Auth and returns tokens."""
        logger.info(f"AuthAgent: Attempting to sign in user {signin_data.email}")
        response = await self._make_supabase_auth_request("POST", "token", params={"grant_type": "password"}, json_data=signin_data.model_dump())

        if response.status_code != 200:
            logger.warning(f"AuthAgent: Supabase sign-in failed for {signin_data.email}. Status: {response.status_code}")
            # Error details are often generic for security on sign-in failures
            raise ValueError("Invalid email or password.")
        
        logger.info(f"AuthAgent: User {signin_data.email} signed in successfully.")
        return response.json() # Returns Supabase token response

    async def refresh_user_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refreshes a user's access token using Supabase Auth."""
        logger.info(f"AuthAgent: Attempting to refresh token.")
        response = await self._make_supabase_auth_request("POST", "token", params={"grant_type": "refresh_token"}, json_data={"refresh_token": refresh_token})

        if response.status_code != 200:
            logger.warning(f"AuthAgent: Supabase token refresh failed. Status: {response.status_code}")
            raise ValueError("Invalid or expired refresh token.")
        
        logger.info(f"AuthAgent: Token refreshed successfully.")
        return response.json()

    async def send_password_reset_email(self, email: EmailStr) -> None:
        """Initiates a password reset process via Supabase Auth."""
        logger.info(f"AuthAgent: Sending password reset email to {email}")
        response = await self._make_supabase_auth_request("POST", "recover", json_data={"email": email})

        if response.status_code != 200:
            # Log the actual error internally, but don't expose details to prevent email enumeration
            logger.error(f"AuthAgent: Supabase password reset request for {email} failed. Status: {response.status_code}, Response: {response.text}")
        # Always return as if successful to the caller to prevent email enumeration
        logger.info(f"AuthAgent: Password reset email request processed for {email} (actual outcome hidden from client).")
        return # No explicit return needed

    async def sign_out_user(self, access_token: str) -> None:
        """Signs out a user from Supabase Auth."""
        logger.info(f"AuthAgent: Attempting to sign out user.")
        # Supabase signout requires the user's JWT in the Authorization header
        custom_headers = {"Authorization": f"Bearer {access_token}"}
        response = await self._make_supabase_auth_request("POST", "logout", headers=custom_headers)

        if response.status_code != 204: # Supabase logout returns 204 No Content on success
            logger.warning(f"AuthAgent: Supabase sign-out failed. Status: {response.status_code}, Response: {response.text}")
            # Even if it fails, the client should proceed as if signed out. 
            # The token might be invalid already.
            # Raise ValueError("Sign out failed on the server.") # Or just log and proceed
        logger.info(f"AuthAgent: Sign out request processed.")
        return
    
    async def get_user_profile(self, user_id: str) -> Optional[UserProfileResponse]:
        """Retrieves the user's profile from the local database."""
        logger.info(f"AuthAgent: Getting profile for user_id {user_id}")
        profile_data = await self.db_service.get_user_profile(user_id)
        if profile_data:
            return UserProfileResponse(**profile_data) # Ensure model mapping
        return None

    async def update_user_profile(self, user_id: str, update_data: UserUpdateRequest) -> Optional[UserProfileResponse]:
        """Updates a user's profile in the local database."""
        logger.info(f"AuthAgent: Updating profile for user_id {user_id}")
        update_payload = update_data.model_dump(exclude_unset=True)
        if not update_payload:
            logger.info("AuthAgent: No data provided for profile update.")
            # Optionally return current profile or raise error
            current_profile = await self.get_user_profile(user_id)
            return current_profile

        updated_profile_data = await self.db_service.update_user_profile(user_id, update_payload)
        if updated_profile_data:
            return UserProfileResponse(**updated_profile_data)
        logger.warning(f"AuthAgent: Profile update failed or user {user_id} not found for update.")
        return None

    async def update_auth_user_password(self, access_token: str, new_password: str) -> None:
        """Updates the authenticated user's password in Supabase Auth."""
        logger.info("AuthAgent: Attempting to update user password in Supabase Auth.")
        custom_headers = {"Authorization": f"Bearer {access_token}"}
        response = await self._make_supabase_auth_request("PUT", "user", json_data={"password": new_password}, headers=custom_headers)

        if response.status_code != 200:
            logger.error(f"AuthAgent: Supabase password update failed. Status: {response.status_code}, Response: {response.text}")
            error_detail = response.json().get('msg', 'Failed to update password.')
            raise ValueError(f"Password update failed: {error_detail}")
        
        logger.info("AuthAgent: User password updated successfully in Supabase Auth.")
        return

    # TODO: Add method for Supabase Admin API actions if needed, e.g., deleting a user fully
    # async def delete_auth_user_admin(self, user_id: str):
    #     if not SUPABASE_SERVICE_ROLE_KEY:
    #         logger.error("SUPABASE_SERVICE_ROLE_KEY not set. Cannot perform admin user deletion.")
    #         raise ValueError("Admin key not configured for this operation.")
    #     headers = {"apikey": SUPABASE_SERVICE_ROLE_KEY, "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"}
    #     response = await self._make_supabase_auth_request("DELETE", f"admin/users/{user_id}", headers=headers)
    #     if response.status_code != 200: # Check Supabase docs for correct status
    #         logger.error(f"AuthAgent: Supabase admin user deletion for {user_id} failed. Status: {response.status_code}")
    #         raise ValueError("Failed to delete user from authentication provider.")
    #     logger.info(f"AuthAgent: User {user_id} deleted from Supabase Auth by admin action.")
    #     # Also delete local profile
    #     await self.db_service.delete_user_profile(user_id) # Assuming this method exists 