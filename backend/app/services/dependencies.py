import os
import jwt
import json
import logging
from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Define the mock admin user constant
MOCK_ADMIN_USER = {
    "id": "admin-user-id",
    "email": "admin@example.com",
    "name": "Admin User",
}

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Add checks for mandatory keys
if not SUPABASE_URL or not SUPABASE_KEY or not JWT_SECRET_KEY:
    raise EnvironmentError(
        "Missing critical environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or JWT_SECRET_KEY must be set."
    )

logger.info(f"Auth service loaded JWT_SECRET_KEY: {JWT_SECRET_KEY[:5]}...")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info(f"Supabase client initialized with URL: {SUPABASE_URL}")
except Exception as e:
    logger.error(f"Error initializing Supabase client: {str(e)}")
    supabase = None
    logger.warning("Using fallback mode for dependencies")

# Import services
from app.services.embedding_service import EmbeddingService, EmbeddingProviderFactory
from app.services.vector_store_service import VectorStoreService


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get the current user from the JWT token."""
    logger.debug(f"Processing auth token (first 10 chars): {token[:10]}...")

    # Check for mock token for development
    if token == "mock-token-for-admin-auth":
        logger.info("Using mock admin user for development")
        return MOCK_ADMIN_USER

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Verify the token
        logger.debug("Attempting to verify token...")
        try:
            # Try using Supabase JWT secret first
            jwt_secret = os.getenv("SUPABASE_JWT_SECRET") or JWT_SECRET_KEY
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            logger.debug(f"Token verified with payload: {json.dumps(payload)[:50]}...")
        except Exception as e1:
            logger.warning(f"First verification attempt failed: {str(e1)}")
            try:
                # Fallback to decoding without verification for development
                payload = jwt.decode(token, options={"verify_signature": False})
                logger.warning("Token decoded without verification (development mode)")
            except Exception as e2:
                logger.error(f"Token decoding failed: {str(e2)}")
                raise credentials_exception

        # Extract user ID from the token payload
        user_id = None
        if "sub" in payload:
            user_id = payload["sub"]
        elif "user_id" in payload:
            user_id = payload["user_id"]
        elif "uid" in payload:
            user_id = payload["uid"]

        logger.debug(f"Extracted user_id from token: {user_id}")

        if not user_id:
            logger.warning("No user_id found in token payload")
            raise credentials_exception

        # Verify user exists in database
        if supabase:
            try:
                logger.debug(f"Looking up user ID: {user_id} in Supabase")
                response = (
                    supabase.from_("users").select("*").eq("id", user_id).execute()
                )
                if response.data:
                    user = response.data[0]
                    logger.debug(f"User found: {user.get('email')}")
                    return user
                else:
                    logger.info(f"User ID: {user_id} not found in database")

                    # If user not found but token is valid, create a new user
                    # This is useful for development and testing
                    email = payload.get("email", f"{user_id}@example.com")
                    name = payload.get("name", "New User")

                    logger.info(f"Creating new user with email: {email}")
                    new_user = {"id": user_id, "email": email, "name": name}

                    insert_response = supabase.from_("users").insert(new_user).execute()
                    if insert_response.data:
                        logger.info(
                            f"New user created: {insert_response.data[0].get('email')}"
                        )
                        return insert_response.data[0]
                    else:
                        logger.error("Failed to create new user")
                        raise credentials_exception
            except Exception as e:
                logger.error(f"Error looking up user: {str(e)}")
                # Fall through to returning payload as user

        # If Supabase is not available or lookup failed, use payload as user
        logger.warning("Using token payload as user data")
        user = {
            "id": user_id,
            "email": payload.get("email", f"{user_id}@example.com"),
            "name": payload.get("name", "User"),
        }
        return user

    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise credentials_exception


# --- Service Instances (Singletons or Factories) ---

# Create provider-based embedding service
embedding_service_instance = EmbeddingService()

# Initialize vector store service that uses the embedding provider
vector_store_service_instance = VectorStoreService()


def get_embedding_service() -> EmbeddingService:
    """Dependency function to get the singleton EmbeddingService instance."""
    return embedding_service_instance


def get_vector_store_service() -> VectorStoreService:
    """Dependency function to get the singleton VectorStoreService instance."""
    return vector_store_service_instance
