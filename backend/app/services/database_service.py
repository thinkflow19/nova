import logging
import httpx
from typing import Dict, List, Any, Optional
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from uuid import UUID
from app.config.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseService:
    """
    Async service for interacting with Supabase database using REST API calls.
    Uses httpx.AsyncClient for asynchronous HTTP requests.
    """

    def __init__(self, schema: str = "public"):
        """Initialize the database service with Supabase credentials from settings."""
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            logger.critical("DatabaseService cannot initialize: Missing Supabase configuration")
            raise EnvironmentError("Missing Supabase configuration for DatabaseService")

        self.schema = schema
        self.supabase_url = settings.SUPABASE_URL.rstrip("/")
        self.rest_url = f"{self.supabase_url}/rest/v1"
        self.headers = {
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation, count=exact",
            "X-Client-Info": "service_role"
        }
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20)
        )
        logger.info(f"Database service initialized with Supabase URL: {self.supabase_url}, schema: {schema}")

    async def close(self):
        """Close the HTTP client."""
        await self.http_client.aclose()
        logger.info("DatabaseService HTTP client closed")

    async def _handle_response(self, response: httpx.Response, operation: str) -> Any:
        """Handle API responses and errors."""
        if 200 <= response.status_code < 300:
            if response.status_code == 204 or not response.content:
                return None
            try:
                data = response.json()
                if isinstance(data, list) and data:
                    return data
                elif isinstance(data, dict):
                    return [data]  # Wrap single object in list for consistency
                return data
            except ValueError:
                logger.warning(f"{operation} successful but response body was not valid JSON")
                return None
        error_detail = response.text
        try:
            error_detail = response.json().get("message", response.text)
        except ValueError:
            pass
        logger.error(f"{operation} failed: {response.status_code} - {error_detail}")
        if response.status_code == 404:
            raise Exception(f"Record not found during {operation}")
        elif response.status_code in (401, 403):
            raise Exception(f"Authorization error during {operation}: Check Service Role Key")
        elif response.status_code == 429:
            raise Exception(f"Rate limit exceeded during {operation}")
        raise Exception(f"{operation} failed: {response.status_code} - {error_detail}")

    def _build_table_url(self, table_name: str) -> str:
        """Build the correct URL for a table, including schema if needed."""
        if "." in table_name:
            return f"{self.rest_url}/{table_name}"
        return f"{self.rest_url}/{table_name}"

    @staticmethod
    def _validate_uuid(value: str, field: str = "ID") -> str:
        """Validate UUID format."""
        try:
            UUID(value)
            return value
        except ValueError:
            raise ValueError(f"Invalid UUID format for {field}: {value}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
        reraise=True
    )
    async def _execute_request(self, method: str, table: str, params=None, json_data=None) -> httpx.Response:
        """Execute an async HTTP request with schema fallback and retry logic."""
        params = params or {}
        url = self._build_table_url(table)
        logger.info(f"Making {method.upper()} request to: {url}")

        try:
            response = await self.http_client.request(
                method=method,
                url=url,
                headers=self.headers,
                params=params,
                json=json_data
            )
            if response.status_code == 404 or ("relation" in response.text and "does not exist" in response.text):
                logger.warning(f"Table '{table}' not found, trying with public schema")
                url = self._build_table_url(f"public.{table}")
                response = await self.http_client.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    params=params,
                    json=json_data
                )
            if response.status_code >= 400:
                logger.error(f"Request failed: {response.status_code} - {response.text}")
                logger.error(f"Request URL: {url}, Params: {params}, Payload: {json_data}")
            return response
        except httpx.RequestError as e:
            logger.error(f"Request error for {method} {url}: {str(e)}")
            raise

    async def create_project(
        self,
        name: str,
        user_id: str,
        description: Optional[str] = None,
        is_public: bool = False,
        icon: Optional[str] = None,
        color: Optional[str] = None,
        ai_config: Optional[Dict[str, Any]] = None,
        memory_type: str = "default",
        tags: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Create a new project."""
        self._validate_uuid(user_id, "user_id")
        payload = {
            "name": name,
            "user_id": user_id,
            "description": description,
            "is_public": is_public,
            "icon": icon,
            "color": color,
            "ai_config": ai_config or {},
            "memory_type": memory_type,
            "tags": tags or [],
        }
        logger.info(f"Creating project: {name}")
        response = await self._execute_request("POST", "projects", json_data=payload)
        result = await self._handle_response(response, "create_project")
        if isinstance(result, list) and result:
            return result[0]
        elif result:
            return result
        raise Exception("Project creation succeeded but no data returned")

    async def get_project(self, project_id: str) -> Dict[str, Any]:
        """Get a project by ID."""
        project_id = self._validate_uuid(project_id, "project_id")
        logger.info(f"Retrieving project with ID: {project_id}")
        params = {"id": f"eq.{project_id}", "select": "*", "limit": 1}
        response = await self._execute_request("GET", "projects", params=params)
        result = await self._handle_response(response, "get_project")
        if isinstance(result, list) and result:
            return result[0]
        raise Exception(f"Project not found: {project_id}")

    async def list_projects(
        self, user_id: str, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List projects for a user."""
        self._validate_uuid(user_id, "user_id")
        logger.info(f"Listing projects for user ID: {user_id}")
        params = {
            "user_id": f"eq.{user_id}",
            "select": "*",
            "limit": str(limit),
            "offset": str(offset),
            "order": "created_at.desc",
        }
        response = await self._execute_request("GET", "projects", params=params)
        return await self._handle_response(response, "list_projects") or []

    async def update_project(
        self, project_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a project."""
        project_id = self._validate_uuid(project_id, "project_id")
        update_data = {k: v for k, v in update_data.items() if k != "user_id"}
        logger.info(f"Updating project {project_id} with data: {update_data}")
        params = {"id": f"eq.{project_id}"}
        response = await self._execute_request("PATCH", "projects", params=params, json_data=update_data)
        result = await self._handle_response(response, "update_project")
        if isinstance(result, list) and result:
            return result[0]
        elif result:
            return result
        raise Exception("Project update succeeded but no data returned")

    async def delete_project(self, project_id: str) -> None:
        """Delete a project."""
        project_id = self._validate_uuid(project_id, "project_id")
        logger.info(f"Deleting project {project_id}")
        params = {"id": f"eq.{project_id}"}
        response = await self._execute_request("DELETE", "projects", params=params)
        await self._handle_response(response, "delete_project")

    async def create_document(
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
        project_id = self._validate_uuid(project_id, "project_id")
        self._validate_uuid(user_id, "user_id")
        payload = {
            "name": name,
            "project_id": project_id,
            "user_id": user_id,
            "description": description,
            "storage_path": storage_path,
            "storage_bucket": storage_bucket,
            "file_type": file_type,
            "file_size": file_size,
            "status": "processing",
            "metadata": metadata or {},
        }
        logger.info(f"Creating document {name} for project {project_id}")
        response = await self._execute_request("POST", "documents", json_data=payload)
        result = await self._handle_response(response, "create_document")
        if isinstance(result, list) and len(result) > 0:
            return result[0]
        elif isinstance(result, dict):
            return result
        raise Exception("Document creation succeeded but no data returned")

    async def get_document(self, document_id: str) -> Dict[str, Any]:
        """Get a document by ID."""
        document_id = self._validate_uuid(document_id, "document_id")
        logger.info(f"Retrieving document with ID: {document_id}")
        params = {"id": f"eq.{document_id}", "select": "*", "limit": 1}
        response = await self._execute_request("GET", "documents", params=params)
        result = await self._handle_response(response, "get_document")
        if isinstance(result, list) and result:
            return result[0]
        raise Exception(f"Document not found: {document_id}")

    async def list_documents(
        self, project_id: str, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List documents for a project."""
        project_id = self._validate_uuid(project_id, "project_id")
        logger.info(f"Listing documents for project ID: {project_id}")
        params = {
            "project_id": f"eq.{project_id}",
            "select": "*",
            "limit": str(limit),
            "offset": str(offset),
            "order": "created_at.desc",
        }
        response = await self._execute_request("GET", "documents", params=params)
        return await self._handle_response(response, "list_documents") or []

    async def update_document(
        self, document_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a document."""
        document_id = self._validate_uuid(document_id, "document_id")
        update_data = {
            k: v for k, v in update_data.items() if k not in ["user_id", "project_id"]
        }
        logger.info(f"Updating document {document_id} with data: {update_data}")
        params = {"id": f"eq.{document_id}"}
        response = await self._execute_request("PATCH", "documents", params=params, json_data=update_data)
        result = await self._handle_response(response, "update_document")
        if isinstance(result, list) and result:
            return result[0]
        elif result:
            return result
        raise Exception("Document update succeeded but no data returned")

    async def delete_document(self, document_id: str) -> None:
        """Delete a document."""
        document_id = self._validate_uuid(document_id, "document_id")
        logger.info(f"Deleting document {document_id}")
        params = {"id": f"eq.{document_id}"}
        response = await self._execute_request("DELETE", "documents", params=params)
        await self._handle_response(response, "delete_document")

    async def create_chat_session(
        self,
        project_id: Optional[str],
        user_id: str,
        title: Optional[str] = None,
        summary: Optional[str] = None,
        ai_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new chat session for a project."""
        self._validate_uuid(user_id, "user_id")
        if project_id:
            project_id = self._validate_uuid(project_id, "project_id")
        payload = {
            "project_id": project_id,
            "user_id": user_id,
            "title": title,
            "summary": summary,
            "model_config": ai_config or {},
        }
        logger.info(f"Creating chat session for project {project_id}")
        response = await self._execute_request("POST", "chat_sessions", json_data=payload)
        result = await self._handle_response(response, "create_chat_session")
        if isinstance(result, list) and result:
            return result[0]
        elif result:
            return result
        raise Exception("Chat session creation succeeded but no data returned")

    async def get_chat_session(self, session_id: str) -> Dict[str, Any]:
        """Get a chat session by ID."""
        session_id = self._validate_uuid(session_id, "session_id")
        logger.info(f"Retrieving chat session with ID: {session_id}")
        params = {"id": f"eq.{session_id}", "select": "*", "limit": 1}
        response = await self._execute_request("GET", "chat_sessions", params=params)
        result = await self._handle_response(response, "get_chat_session")
        if isinstance(result, list) and result:
            return result[0]
        raise Exception(f"Chat session not found: {session_id}")

    async def update_chat_session(self, session_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a chat session."""
        session_id = self._validate_uuid(session_id, "session_id")
        update_data = {k: v for k, v in update_data.items() if k not in ["user_id", "project_id"]}
        logger.info(f"Updating chat session {session_id} with data: {update_data}")
        params = {"id": f"eq.{session_id}"}
        response = await self._execute_request("PATCH", "chat_sessions", params=params, json_data=update_data)
        result = await self._handle_response(response, "update_chat_session")
        if isinstance(result, list) and result:
            return result[0]
        elif result:
            return result
        raise Exception("Chat session update succeeded but no data returned")

    async def delete_chat_session(self, session_id: str) -> None:
        """Delete a chat session."""
        session_id = self._validate_uuid(session_id, "session_id")
        logger.info(f"Deleting chat session {session_id}")
        params = {"id": f"eq.{session_id}"}
        response = await self._execute_request("DELETE", "chat_sessions", params=params)
        await self._handle_response(response, "delete_chat_session")

    async def list_chat_sessions(
        self, user_id: str, project_id: Optional[str] = None, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List chat sessions for a project or user."""
        self._validate_uuid(user_id, "user_id")
        if project_id:
            project_id = self._validate_uuid(project_id, "project_id")
        logger.info(f"Listing chat sessions for user {user_id}, project {project_id}")
        params = {
            "user_id": f"eq.{user_id}",
            "select": "*",
            "limit": str(limit),
            "offset": str(offset),
            "order": "created_at.desc",
        }
        if project_id:
            params["project_id"] = f"eq.{project_id}"
        response = await self._execute_request("GET", "chat_sessions", params=params)
        return await self._handle_response(response, "list_chat_sessions") or []

    async def create_chat_message(
        self,
        session_id: str,
        project_id: Optional[str],
        user_id: str,
        role: str,
        content: str,
        tokens: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new chat message."""
        session_id = self._validate_uuid(session_id, "session_id")
        self._validate_uuid(user_id, "user_id")
        if project_id:
            project_id = self._validate_uuid(project_id, "project_id")
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
        response = await self._execute_request("POST", "chat_messages", json_data=payload)
        result = await self._handle_response(response, "create_chat_message")
        if isinstance(result, list) and result:
            return result[0]
        elif result:
            return result
        raise Exception("Chat message creation succeeded but no data returned")

    async def list_chat_messages(
        self, session_id: str, limit: int = 100, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List chat messages for a session."""
        session_id = self._validate_uuid(session_id, "session_id")
        logger.info(f"Listing chat messages for session ID: {session_id}")
        params = {
            "session_id": f"eq.{session_id}",
            "select": "*",
            "limit": str(limit),
            "offset": str(offset),
            "order": "created_at.asc",
        }
        response = await self._execute_request("GET", "chat_messages", params=params)
        return await self._handle_response(response, "list_chat_messages") or []

    async def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile by user ID."""
        user_id = self._validate_uuid(user_id, "user_id")
        logger.info(f"Retrieving user profile for user ID: {user_id}")
        params = {"id": f"eq.{user_id}", "select": "*", "limit": 1}
        response = await self._execute_request("GET", "user_profiles", params=params)
        result = await self._handle_response(response, "get_user_profile")
        return result[0] if isinstance(result, list) and result else None

    async def create_user_profile(
        self,
        user_id: str,
        display_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        bio: Optional[str] = None,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Create a new user profile."""
        user_id = self._validate_uuid(user_id, "user_id")
        payload = {
            "id": user_id,
            "display_name": display_name,
            "avatar_url": avatar_url,
            "bio": bio,
            "preferences": preferences or {},
        }
        logger.info(f"Creating user profile for user ID: {user_id}")
        response = await self._execute_request("POST", "user_profiles", json_data=payload)
        result = await self._handle_response(response, "create_user_profile")
        if isinstance(result, list) and result:
            return result[0]
        elif result:
            return result
        raise Exception("User profile creation succeeded but no data returned")

    async def update_user_profile(
        self, user_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a user profile."""
        user_id = self._validate_uuid(user_id, "user_id")
        logger.info(f"Updating user profile for user ID: {user_id}")
        params = {"id": f"eq.{user_id}"}
        response = await self._execute_request("PATCH", "user_profiles", params=params, json_data=update_data)
        result = await self._handle_response(response, "update_user_profile")
        if isinstance(result, list) and result:
            return result[0]
        elif result:
            return result
        raise Exception("User profile update succeeded but no data returned")

    async def table_exists(self, table_name: str) -> bool:
        """Check if a table exists in the Supabase schema."""
        table_versions = [table_name]
        if "." not in table_name:
            table_versions.append(f"public.{table_name}")

        for table in table_versions:
            try:
                response = await self._execute_request("HEAD", table, params={"limit": 0})
                if response.status_code == 200:
                    logger.debug(f"Table '{table}' exists")
                    return True
            except Exception as e:
                logger.error(f"Error checking table '{table}' existence: {str(e)}")
                continue
        logger.info(f"Table '{table_name}' does not exist")
        return False

    async def execute_custom_query(
        self, table: str, query_params: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Execute a custom query on a table with support for GET, PATCH, DELETE."""
        params = {}
        method = "GET"
        json_data = None

        if "method" in query_params:
            method = query_params["method"].upper()
            del query_params["method"]

        if method == "PATCH" and "update" in query_params:
            json_data = query_params["update"]
            query_params = {k: v for k, v in query_params.items() if k != "update"}
        elif method == "DELETE" and "delete" in query_params:
            del query_params["delete"]

        if "select" in query_params:
            params["select"] = query_params["select"]
        if "order" in query_params:
            params["order"] = query_params["order"]
        if "limit" in query_params:
            params["limit"] = query_params["limit"]
        if "offset" in query_params:
            params["offset"] = query_params["offset"]
        if "filters" in query_params and query_params["filters"]:
            for field, value in query_params["filters"].items():
                params[field] = value
        if "id" in query_params:
            params["id"] = query_params["id"]

        logger.info(f"Executing custom query on {table} with method {method}")
        response = await self._execute_request(method, table, params=params, json_data=json_data)
        results = await self._handle_response(response, f"execute_custom_query_{method.lower()}")
        logger.info(f"Query returned {len(results or [])} results")
        return results or []
