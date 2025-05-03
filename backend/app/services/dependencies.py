import os
import jwt
import json
import logging
from typing import Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import httpx

# Import settings instance
from app.config.settings import settings

# Import services (DatabaseService needed for get_user_profile)
from app.services.database_service import DatabaseService

# Import other services if their instances are needed here via DI functions
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService

# Initialize logger and security scheme
logger = logging.getLogger(__name__)
security = HTTPBearer()

# Create service instances (or use factory functions/DI)
# It's generally better practice to inject dependencies rather than creating global instances here,
# especially if services depend on each other or external resources.
# However, keeping it simple for now based on existing structure.
db_service = DatabaseService()
# embedding_service = EmbeddingService()
# vector_store_service = VectorStoreService()


def raise_auth_exception(detail: str = "Invalid authentication credentials"):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    token = credentials.credentials
    user_id = None

    # Use settings for secrets/keys
    if settings.SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,  # Use from settings
                algorithms=["HS256"],
                options={
                    "verify_signature": True,
                    "verify_aud": False,
                    "verify_exp": True,
                },
            )
            user_id = payload.get("sub")
            if not user_id:
                raise_auth_exception()
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            raise_auth_exception("Token has expired")
        except jwt.PyJWTError as e:
            logger.warning(f"Invalid JWT token: {e}")  # Log the error
            raise_auth_exception()
    else:
        # Use settings for anon key and URL
        if not settings.SUPABASE_ANON_KEY or not settings.SUPABASE_URL:
            logger.error(
                "SUPABASE_ANON_KEY or SUPABASE_URL not configured for token validation"
            )
            raise_auth_exception()

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{settings.SUPABASE_URL}/auth/v1/user",  # Use from settings
                    headers={
                        "apikey": settings.SUPABASE_ANON_KEY,  # Use from settings
                        "Authorization": f"Bearer {token}",
                    },
                    timeout=10.0,  # Add a timeout
                )
                response.raise_for_status()  # Raise HTTP errors
            except httpx.RequestError as e:
                logger.error(f"HTTP request to Supabase /auth/v1/user failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Auth service unavailable",
                )
            except httpx.HTTPStatusError as e:
                logger.warning(
                    f"Token verification via Supabase failed: {e.response.status_code} - {e.response.text}"
                )
                raise_auth_exception()

            user_data = response.json()
            user_id = user_data.get("id")
            if not user_id:
                logger.error("Missing user ID in Supabase user response")
                raise_auth_exception()

    # Ensure user_id was obtained
    if not user_id:
        logger.error("Could not determine user ID from token.")
        raise_auth_exception()

    # Fetch user info using the obtained user_id
    # Wrap this in a try/except as get_user_info can raise 500
    try:
        user_info = await get_user_info(user_id)
        return user_info
    except HTTPException as e:
        # Re-raise HTTPException from get_user_info
        raise e
    except Exception as e:
        # Catch unexpected errors during user info retrieval
        logger.exception(
            f"Unexpected error fetching user info for {user_id} in get_current_user"
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user details after authentication.",
        )


async def get_user_info(user_id: str) -> Dict[str, Any]:
    try:
        # Use settings for Supabase URL and Service Role Key
        auth_user = await get_auth_user(user_id)
        # db_service instance is created above
        profile = await db_service.get_user_profile(user_id)

        user_info = {
            "id": user_id,
            "email": auth_user.get("email"),
            "created_at": auth_user.get("created_at"),
            "user_metadata": auth_user.get("user_metadata", {}),
            "app_metadata": auth_user.get("app_metadata", {}),
            "last_sign_in_at": auth_user.get("last_sign_in_at"),
            "role": auth_user.get("role", "user"),
        }

        if profile:
            user_info.update(
                {
                    "display_name": profile.get("display_name"),
                    "avatar_url": profile.get("avatar_url"),
                    "bio": profile.get("bio"),
                    "preferences": profile.get("preferences", {}),
                    "updated_at": profile.get("updated_at"),
                }
            )

        return user_info
    except Exception as e:
        logger.exception("Error getting user info")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information",
        )


async def get_auth_user(user_id: str) -> Dict[str, Any]:
    # Use settings for Supabase URL and Service Role Key
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.error("Supabase Admin credentials (URL/Service Key) not set in settings")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication admin service unavailable",
        )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}",  # Use from settings
                headers={
                    "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,  # Use from settings
                    "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",  # Use from settings
                },
                timeout=10.0,  # Add a timeout
            )
            response.raise_for_status()  # Raise HTTP errors (like 404)
        except httpx.RequestError as e:
            logger.error(f"HTTP request to Supabase /auth/v1/admin/users failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Auth admin service unavailable",
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Auth user not found in Supabase: {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
                )
            else:
                logger.error(
                    f"Supabase admin error getting user {user_id}: {e.response.status_code} - {e.response.text}"
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve authentication details",
                )

        return response.json()


async def get_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict[str, Any]:
    user = await get_current_user(credentials)
    if user.get("role") != "admin":
        logger.warning(f"Unauthorized admin access attempt by user {user['id']}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


# --- Dependency Injection Functions ---
# These functions provide instances of services, using the centralized settings.
# FastAPI will call these for routes that depend on them.


def get_database_service() -> DatabaseService:
    # Can add logic here if needed, but usually just returns the instance
    # The instance already checks settings in its __init__
    global db_service
    if not db_service:  # Should not happen if initialized above, but safety check
        db_service = DatabaseService()
    return db_service


def get_embedding_service() -> EmbeddingService:
    try:
        # Use the shared instance initialized with settings
        from app.services.embedding_service import openai_client, pinecone_client

        # Could potentially create a new instance if needed, but sharing is often better
        return (
            EmbeddingService()
        )  # Assumes its __init__ uses the shared clients/settings
    except Exception as e:
        logger.exception("Embedding service dependency injection failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding service unavailable",
        )


def get_vector_store_service() -> VectorStoreService:
    try:
        # Use the shared instance initialized with settings
        # Its __init__ attempts to get the pinecone client from embedding_service
        return VectorStoreService()
    except Exception as e:
        logger.exception("Vector store service dependency injection failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vector store service unavailable",
        )
