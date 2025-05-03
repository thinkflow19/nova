import logging
import httpx
import asyncio
import requests
from typing import Dict, List, Any, Optional

# Import settings instance
from app.config.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Remove direct env var loading here
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Validation is now done in settings.py
# if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
#     logger.critical("CRITICAL: Missing Supabase URL or Service Role Key.")
#     raise EnvironmentError("Missing Supabase configuration.")


class DatabaseService:
    """
    Service for interacting with Supabase database using direct REST API calls
    to avoid schema cache issues with the Supabase client library.
    """

    def __init__(self):
        """Initialize the database service with Supabase credentials from settings."""
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            # This check might be redundant if settings() constructor raises an error,
            # but provides an extra layer of safety specific to this service.
            logger.critical(
                "DatabaseService cannot initialize: Missing Supabase URL or Service Role Key in settings."
            )
            raise EnvironmentError(
                "Missing Supabase configuration for DatabaseService."
            )

        self.rest_url = f"{settings.SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }
        logger.info(
            f"Database service initialized with Supabase URL: {settings.SUPABASE_URL}"
        )

    def _handle_response(self, response: requests.Response, operation: str):
        """Helper function to handle API responses and errors."""
        if 200 <= response.status_code < 300:
            try:
                # For successful creation (201) or update/get (200), response usually has content
                # For successful delete (204), response has no content
                return response.json() if response.content else None
            except (
                ValueError
            ):  # Handle cases where response is successful but JSON is empty/invalid
                logger.warning(
                    f"{operation} successful but response body was not valid JSON."
                )
                return None
        else:
            error_detail = "Unknown error"
            try:
                error_detail = response.json().get("message", response.text)
            except ValueError:
                error_detail = response.text
            logger.error(f"{operation} failed: {response.status_code} - {error_detail}")
            # Raise specific exceptions based on status code if needed
            if response.status_code == 404:
                raise Exception(f"Record not found during {operation}")
            elif response.status_code == 401 or response.status_code == 403:
                raise Exception(
                    f"Authorization error during {operation}: Check Service Role Key."
                )
            raise Exception(
                f"{operation} failed: {response.status_code} - {error_detail}"
            )

    def create_project(
        self,
        name: str,
        user_id: str,
        description: Optional[str] = None,
        is_public: bool = False,
        icon: Optional[str] = None,
        ai_model_config: Optional[Dict[str, Any]] = None,
        memory_type: str = "default",
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Create a new project."""
        payload = {
            "name": name,
            "user_id": user_id,
            "description": description,
            "is_public": is_public,
            "icon": icon,
            "ai_model_config": ai_model_config or {},
            "memory_type": memory_type,
            "tags": tags or [],
        }
        logger.info(f"Creating project: {name}")
        response = requests.post(
            f"{self.rest_url}/projects", headers=self.headers, json=payload
        )
        result = self._handle_response(response, "create_project")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:
            return result
        else:
            raise Exception("Project creation succeeded but no data returned.")

    def get_project(self, project_id: str) -> Dict[str, Any]:
        """Get a project by ID."""
        logger.info(f"Retrieving project with ID: {project_id}")
        response = requests.get(
            f"{self.rest_url}/projects",
            headers=self.headers,
            params={"id": f"eq.{project_id}", "select": "*", "limit": 1},
        )
        result = self._handle_response(response, "get_project")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        else:
            raise Exception(
                f"Project not found: {project_id}"
            )  # More specific exception

    def list_projects(
        self, user_id: str, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List projects for a user."""
        logger.info(f"Listing projects for user ID: {user_id}")
        params = {
            "user_id": f"eq.{user_id}",  # Filter by the authenticated user ID
            "select": "*",
            "limit": str(limit),
            "offset": str(offset),
            "order": "created_at.desc",  # Optional: order by creation date
        }
        response = requests.get(
            f"{self.rest_url}/projects", headers=self.headers, params=params
        )
        return self._handle_response(response, "list_projects") or []

    def update_project(
        self, project_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a project."""
        # Ensure user_id is not in the update payload from backend service
        if "user_id" in update_data:
            del update_data["user_id"]

        logger.info(f"Updating project {project_id} with data: {update_data}")
        response = requests.patch(
            f"{self.rest_url}/projects",
            headers=self.headers,
            params={"id": f"eq.{project_id}"},
            json=update_data,
        )
        # Supabase returns a list even for single update, get the first item
        result = self._handle_response(response, "update_project")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:
            logger.warning("Update project returned a single object, expected list.")
            return result
        else:
            raise Exception("Project update succeeded but no data returned.")

    def delete_project(self, project_id: str) -> None:
        """Delete a project."""
        logger.info(f"Deleting project {project_id}")
        response = requests.delete(
            f"{self.rest_url}/projects",
            headers=self.headers,
            params={"id": f"eq.{project_id}"},
        )
        # Expect 204 No Content on successful delete
        self._handle_response(response, "delete_project")
        return None  # Explicitly return None

    def create_document(
        self,
        name: str,
        project_id: str,
        user_id: str,
        storage_path: str,
        storage_bucket: str,
        description: Optional[str] = None,
        file_type: Optional[str] = None,
        file_size: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new document."""
        payload = {
            "name": name,
            "project_id": project_id,
            "user_id": user_id,
            "description": description,
            "storage_path": storage_path,
            "storage_bucket": storage_bucket,
            "file_type": file_type,
            "file_size": file_size,
            "status": "processing",  # Default status
            "metadata": metadata or {},
        }
        logger.info(f"Creating document {name} for project {project_id}")
        response = requests.post(
            f"{self.rest_url}/documents", headers=self.headers, json=payload
        )
        result = self._handle_response(response, "create_document")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:
            return result
        else:
            raise Exception("Document creation succeeded but no data returned.")

    def get_document(self, document_id: str) -> Dict[str, Any]:
        """Get a document by ID."""
        logger.info(f"Retrieving document with ID: {document_id}")
        response = requests.get(
            f"{self.rest_url}/documents",
            headers=self.headers,
            params={"id": f"eq.{document_id}", "select": "*", "limit": 1},
        )
        result = self._handle_response(response, "get_document")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        else:
            raise Exception(f"Document not found: {document_id}")

    def list_documents(
        self, project_id: str, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List documents for a project."""
        logger.info(f"Listing documents for project ID: {project_id}")
        params = {
            "project_id": f"eq.{project_id}",
            "select": "*",
            "limit": str(limit),
            "offset": str(offset),
            "order": "created_at.desc",
        }
        response = requests.get(
            f"{self.rest_url}/documents", headers=self.headers, params=params
        )
        return self._handle_response(response, "list_documents") or []

    def update_document(
        self, document_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a document."""
        if "user_id" in update_data or "project_id" in update_data:
            # Don't allow changing ownership
            logger.warning(
                "Attempted to change document ownership via update - ignoring"
            )
            update_data = {
                k: v
                for k, v in update_data.items()
                if k not in ["user_id", "project_id"]
            }

        logger.info(f"Updating document {document_id} with data: {update_data}")
        response = requests.patch(
            f"{self.rest_url}/documents",
            headers=self.headers,
            params={"id": f"eq.{document_id}"},
            json=update_data,
        )
        result = self._handle_response(response, "update_document")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:
            return result
        else:
            raise Exception("Document update succeeded but no data returned.")

    def delete_document(self, document_id: str) -> None:
        """Delete a document."""
        logger.info(f"Deleting document {document_id}")
        response = requests.delete(
            f"{self.rest_url}/documents",
            headers=self.headers,
            params={"id": f"eq.{document_id}"},
        )
        self._handle_response(response, "delete_document")
        return None

    def create_chat_session(
        self,
        project_id: str,
        user_id: str,
        title: Optional[str] = None,
        summary: Optional[str] = None,
        ai_model_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new chat session for a project."""
        payload = {
            "project_id": project_id,
            "user_id": user_id,
            "title": title,
            "summary": summary,
            "model_config": ai_model_config
            or {},  # Keep database field as model_config
        }
        logger.info(f"Creating chat session for project {project_id}")
        response = requests.post(
            f"{self.rest_url}/chat_sessions", headers=self.headers, json=payload
        )
        result = self._handle_response(response, "create_chat_session")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:
            return result
        else:
            raise Exception("Chat session creation succeeded but no data returned.")

    def get_chat_session(self, session_id: str) -> Dict[str, Any]:
        """Get a chat session by ID."""
        logger.info(f"Retrieving chat session with ID: {session_id}")
        response = requests.get(
            f"{self.rest_url}/chat_sessions",
            headers=self.headers,
            params={"id": f"eq.{session_id}", "select": "*", "limit": 1},
        )
        result = self._handle_response(response, "get_chat_session")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        else:
            raise Exception(f"Chat session not found: {session_id}")

    def list_chat_sessions(
        self, project_id: str, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List chat sessions for a project."""
        logger.info(f"Listing chat sessions for project ID: {project_id}")
        params = {
            "project_id": f"eq.{project_id}",
            "select": "*",
            "limit": str(limit),
            "offset": str(offset),
            "order": "created_at.desc",
        }
        response = requests.get(
            f"{self.rest_url}/chat_sessions", headers=self.headers, params=params
        )
        return self._handle_response(response, "list_chat_sessions") or []

    def create_chat_message(
        self,
        session_id: str,
        project_id: str,
        user_id: str,
        role: str,
        content: str,
        tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new chat message."""
        payload = {
            "session_id": session_id,
            "project_id": project_id,
            "user_id": user_id,
            "role": role,
            "content": content,
            "tokens": tokens,
            "metadata": metadata or {},
        }
        logger.info(f"Creating chat message for session {session_id}")
        response = requests.post(
            f"{self.rest_url}/chat_messages", headers=self.headers, json=payload
        )
        result = self._handle_response(response, "create_chat_message")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:
            return result
        else:
            raise Exception("Chat message creation succeeded but no data returned.")

    def list_chat_messages(
        self, session_id: str, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List chat messages for a session."""
        logger.info(f"Listing chat messages for session ID: {session_id}")
        params = {
            "session_id": f"eq.{session_id}",
            "select": "*",
            "limit": str(limit),
            "offset": str(offset),
            "order": "created_at.asc",  # Messages in chronological order
        }
        response = requests.get(
            f"{self.rest_url}/chat_messages", headers=self.headers, params=params
        )
        return self._handle_response(response, "list_chat_messages") or []

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by user ID using httpx directly."""
        logger.info(f"Retrieving user profile for user ID: {user_id}")
        url = (
            f"{self.rest_url}/user_profiles"  # Targets public.user_profiles by default
        )
        params = {"id": f"eq.{user_id}", "select": "*", "limit": 1}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers, params=params)

                if response.status_code == 200:
                    result = response.json()
                    # Ensure result is a list and not empty before accessing index 0
                    return result[0] if isinstance(result, list) and result else None
                elif response.status_code == 404 or "does not exist" in response.text:
                    logger.warning(f"User profile not found for user ID: {user_id}")
                    return None
                else:
                    # Log other non-200 errors
                    logger.error(
                        f"get_user_profile failed: {response.status_code} - {response.text}"
                    )
                    return None  # Return None for all other errors too

        except httpx.RequestError as e:
            logger.error(
                f"HTTP request failed for get_user_profile ({user_id}): {str(e)}"
            )
            return None
        except Exception as e:
            logger.exception(
                f"Unexpected error in get_user_profile for {user_id}: {str(e)}"
            )
            return None

    def create_user_profile(
        self,
        user_id: str,
        display_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        bio: Optional[str] = None,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new user profile."""
        payload = {
            "id": user_id,  # Use the auth.users id
            "display_name": display_name,
            "avatar_url": avatar_url,
            "bio": bio,
            "preferences": preferences or {},
        }
        logger.info(f"Creating user profile for user ID: {user_id}")
        response = requests.post(
            f"{self.rest_url}/user_profiles", headers=self.headers, json=payload
        )
        result = self._handle_response(response, "create_user_profile")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:
            return result
        else:
            raise Exception("User profile creation succeeded but no data returned.")

    def update_user_profile(
        self, user_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a user profile."""
        logger.info(f"Updating user profile for user ID: {user_id}")
        response = requests.patch(
            f"{self.rest_url}/user_profiles",
            headers=self.headers,
            params={"id": f"eq.{user_id}"},
            json=update_data,
        )
        result = self._handle_response(response, "update_user_profile")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:
            return result
        else:
            raise Exception("User profile update succeeded but no data returned.")

    async def table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the Supabase schema."""
        try:
            # We can check by trying to select a single row with limit 1
            # A 404 or specific error code usually indicates the table doesn't exist.
            # Using HEAD might be more efficient if supported for tables.
            # Let's try a SELECT with limit 0 for efficiency.
            response = requests.get(
                f"{self.rest_url}/{table_name}",
                headers=self.headers,
                params={"limit": 0},  # Don't need any data, just check existence
            )

            # Check status code. 200 means table exists. 404 means it doesn't.
            # Other codes might indicate permission issues or other errors.
            if response.status_code == 200:
                logger.debug(f"Table '{table_name}' exists.")
                return True
            elif response.status_code == 404 or (
                response.status_code == 400
                and "relation" in response.text
                and "does not exist" in response.text
            ):
                # Supabase might return 400 if the table doesn't exist but the request is otherwise valid
                logger.info(f"Table '{table_name}' does not exist.")
                return False
            else:
                # Unexpected status code, log an error but maybe assume exists? Or raise?
                # For safety, let's log and return False, requiring manual check.
                logger.error(
                    f"Unexpected status code ({response.status_code}) checking existence of table '{table_name}': {response.text}"
                )
                return False
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error checking table '{table_name}' existence: {e}")
            # Can't be sure, assume it doesn't exist or raise error?
            # Let's raise to make the failure explicit
            raise RuntimeError(
                f"Could not verify existence of table '{table_name}' due to network error"
            ) from e
        except Exception as e:
            logger.error(
                f"Unexpected error checking table '{table_name}' existence: {e}",
                exc_info=True,
            )
            raise RuntimeError(
                f"Could not verify existence of table '{table_name}' due to unexpected error"
            ) from e

    def execute_custom_query(
        self, table: str, query_params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Execute a custom query on a table with various filter parameters.

        Args:
            table: The table name to query
            query_params: Dictionary of query parameters
                - select: Fields to select (comma-separated)
                - order: Order by field and direction
                - limit: Maximum number of records
                - offset: Number of records to skip
                - filters: Dictionary of field:value pairs for filtering

        Returns:
            List of matching records
        """
        try:
            url = f"{self.rest_url}/{table}"
            headers = dict(self.headers)
            params = {}

            # Handle select fields
            if "select" in query_params:
                params["select"] = query_params["select"]

            # Handle ordering
            if "order" in query_params:
                params["order"] = query_params["order"]

            # Handle pagination
            if "limit" in query_params:
                params["limit"] = query_params["limit"]

            if "offset" in query_params:
                params["offset"] = query_params["offset"]

            # Handle filters
            if "filters" in query_params and query_params["filters"]:
                filter_parts = []
                for field, value in query_params["filters"].items():
                    filter_parts.append(f"{field}=eq.{value}")

                if filter_parts:
                    url += "?" + "&".join(filter_parts)

            logger.info(f"Executing custom query on {table}")

            response = requests.get(url, headers=headers, params=params)

            if response.status_code != 200:
                logger.error(f"Failed to execute query: {response.text}")
                raise Exception(f"Failed to execute query: {response.text}")

            results = response.json()
            logger.info(f"Query returned {len(results)} results")

            return results

        except Exception as e:
            logger.error(f"Error executing custom query: {str(e)}")
            raise


# Example usage
if __name__ == "__main__":
    try:
        db = DatabaseService()

        # Create a test project
        test_project = db.create_project(
            name=f"Test Project {uuid.uuid4().hex[:8]}",
            description="Created for testing the database service",
            user_id=uuid.uuid4().hex[:8],
        )

        print(f"Created project: {test_project}")

        # Get the project
        retrieved_project = db.get_project(test_project["id"])
        print(f"Retrieved project: {retrieved_project}")

        # Update the project
        updated_project = db.update_project(
            test_project["id"], {"description": "Updated description"}
        )
        print(f"Updated project: {updated_project}")

        # List projects
        projects = db.list_projects(user_id=test_project["user_id"], limit=5)
        print(f"Projects: {projects}")

        # Delete the test project
        db.delete_project(test_project["id"])
        print("Project deleted successfully")

    except Exception as e:
        print(f"Error: {str(e)}")
