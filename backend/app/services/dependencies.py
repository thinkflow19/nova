import os
import jwt
import json
from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from supabase import create_client, Client

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

print(f"Environment loaded - JWT_SECRET_KEY: {JWT_SECRET_KEY[:5]}..." if JWT_SECRET_KEY else "JWT_SECRET_KEY not set")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"Supabase client initialized with URL: {SUPABASE_URL}")
except Exception as e:
    print(f"Error initializing Supabase client: {str(e)}")
    supabase = None
    print("Using fallback mode for dependencies")

# Added imports for new services
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Get the current user from the JWT token."""
    print(f"Processing token: {token[:10]}...")

    # Check for mock token for development
    if token == "mock-token-for-admin-auth":
        print("Using mock admin user for development")
        return MOCK_ADMIN_USER

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Verify the token
        print("Attempting to verify token...")
        try:
            # Try using Supabase JWT secret first
            jwt_secret = os.getenv("SUPABASE_JWT_SECRET") or JWT_SECRET_KEY
            payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
            print(f"Token verified with payload: {json.dumps(payload)[:50]}...")
        except Exception as e1:
            print(f"First verification attempt failed: {str(e1)}")
            try:
                # Fallback to decoding without verification for development
                payload = jwt.decode(token, options={"verify_signature": False})
                print("Token decoded without verification (development mode)")
            except Exception as e2:
                print(f"Token decoding failed: {str(e2)}")
                raise credentials_exception

        # Extract user ID from the token payload
        user_id = None
        if "sub" in payload:
            user_id = payload["sub"]
        elif "user_id" in payload:
            user_id = payload["user_id"]
        elif "uid" in payload:
            user_id = payload["uid"]

        print(f"Extracted user_id from token: {user_id}")

        if not user_id:
            print("No user_id found in token payload")
            raise credentials_exception

        # Verify user exists in database
        if supabase:
            try:
                print(f"Looking up user ID: {user_id} in Supabase")
                response = (
                    supabase.from_("users").select("*").eq("id", user_id).execute()
                )
                if response.data:
                    user = response.data[0]
                    print(f"User found: {user.get('email')}")
                    return user
                else:
                    print(f"User ID: {user_id} not found in database")

                    # If user not found but token is valid, create a new user
                    # This is useful for development and testing
                    email = payload.get("email", f"{user_id}@example.com")
                    name = payload.get("name", "New User")

                    print(f"Creating new user with email: {email}")
                    new_user = {"id": user_id, "email": email, "name": name}

                    insert_response = supabase.from_("users").insert(new_user).execute()
                    if insert_response.data:
                        print(
                            f"New user created: {insert_response.data[0].get('email')}"
                        )
                        return insert_response.data[0]
                    else:
                        print("Failed to create new user")
                        raise credentials_exception
            except Exception as e:
                print(f"Error looking up user: {str(e)}")
                # Fall through to returning payload as user

        # If Supabase is not available or lookup failed, use payload as user
        print("Using token payload as user data")
        user = {
            "id": user_id,
            "email": payload.get("email", f"{user_id}@example.com"),
            "name": payload.get("name", "User"),
        }
        return user

    except Exception as e:
        print(f"Authentication error: {str(e)}")
        raise credentials_exception

# --- Service Instances (Singletons or Factories) ---

# We can use singletons for services if they are stateless or manage state appropriately
# Initialize services once to be reused across requests
embedding_service_instance = EmbeddingService()
vector_store_service_instance = VectorStoreService()

def get_embedding_service() -> EmbeddingService:
    """Dependency function to get the singleton EmbeddingService instance."""
    return embedding_service_instance

def get_vector_store_service() -> VectorStoreService:
    """Dependency function to get the singleton VectorStoreService instance."""
    return vector_store_service_instance
