import os
import json
import uuid
import logging
import requests
from typing import Dict, List, Any, Optional, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from the root .env file
# load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
# Env vars should be loaded by main.py now

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    logger.error("Missing Supabase URL or Service Role Key in environment variables.")
    raise EnvironmentError("Missing Supabase configuration.")


class DatabaseService:
    """
    Service for interacting with Supabase database using direct REST API calls
    to avoid schema cache issues with the Supabase client library.
    """

    def __init__(self):
        """Initialize the database service with Supabase credentials."""
        self.rest_url = f"{SUPABASE_URL}/rest/v1"
        # Use the Service Role Key for all backend operations
        self.headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",  # Ask Supabase to return the created/updated record
        }
        logger.info(f"Database service initialized with Supabase URL: {SUPABASE_URL}")

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
    ) -> Dict[str, Any]:
        payload = {
            "name": name,
            "user_id": user_id,
            "description": description,
            "is_public": is_public,
        }
        logger.info(f"Creating project for user {user_id} with name: {name}")
        response = requests.post(
            f"{self.rest_url}/projects", headers=self.headers, json=payload
        )
        # Supabase returns a list even for single insert, get the first item
        result = self._handle_response(response, "create_project")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif result:  # Should ideally be a list, but handle if it's a single dict
            logger.warning("Create project returned a single object, expected list.")
            return result
        else:
            raise Exception("Project creation succeeded but no data returned.")

    def get_project(self, project_id: str) -> Dict[str, Any]:
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
        logger.info(f"Deleting project {project_id}")
        response = requests.delete(
            f"{self.rest_url}/projects",
            headers=self.headers,
            params={"id": f"eq.{project_id}"},
        )
        # Expect 204 No Content on successful delete
        self._handle_response(response, "delete_project")
        return None  # Explicitly return None

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
