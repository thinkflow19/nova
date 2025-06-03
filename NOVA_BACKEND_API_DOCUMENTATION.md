**API Documentation**

This document outlines the API endpoints for the Nova backend service.

**Base URL:** `/`

**Authentication Endpoints (`/api/auth`)**

1.  **Sign Up**
    *   **Endpoint:** `POST /api/auth/signup`
    *   **Description:** Registers a new user.
    *   **Request Body:**
        ```json
        {
            "email": "user@example.com",
            "password": "securepassword123",
            "display_name": "Optional User Name",
            "metadata": { /* Optional additional user data */ }
        }
        ```
    *   **Response (201 CREATED):**
        ```json
        {
            "id": "user_uuid",
            "email": "user@example.com",
            "message": "Registration successful. Please check your email to confirm your account."
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: If registration fails (e.g., email already exists, invalid input).
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

2.  **Sign In**
    *   **Endpoint:** `POST /api/auth/signin`
    *   **Description:** Authenticates a user and returns access and refresh tokens.
    *   **Request Body:**
        ```json
        {
            "email": "user@example.com",
            "password": "securepassword123"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "access_token": "your_access_token",
            "refresh_token": "your_refresh_token",
            "token_type": "bearer",
            "expires_in": 3600,
            "user": {
                "id": "user_uuid",
                "email": "user@example.com",
                /* other user details */
            }
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If authentication fails (invalid email or password).
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

3.  **Refresh Token**
    *   **Endpoint:** `POST /api/auth/refresh-token` (also aliased as `POST /api/auth/refresh`)
    *   **Description:** Refreshes an access token using a valid refresh token.
    *   **Request Body:**
        ```json
        {
            "refresh_token": "user_refresh_token"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "access_token": "new_access_token",
            "refresh_token": "new_refresh_token", // May or may not be returned
            "token_type": "bearer",
            "expires_in": 3600
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the refresh token is invalid or expired.
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

4.  **Reset Password**
    *   **Endpoint:** `POST /api/auth/reset-password`
    *   **Description:** Sends a password reset link to the user's email.
    *   **Request Body:**
        ```json
        {
            "email": "user@example.com"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "message": "If your email is registered, you will receive a password reset link shortly."
        }
        ```
        *Note: Always returns a success message to prevent email enumeration, even if the email is not found.*
    *   **Error Responses:**
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs (though the user sees a success message).

5.  **Sign Out**
    *   **Endpoint:** `POST /api/auth/signout`
    *   **Description:** Signs out the currently authenticated user (invalidates session/token on Supabase).
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Response (200 OK):**
        ```json
        {
            "message": "Successfully signed out"
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

6.  **Get Current User Profile**
    *   **Endpoint:** `GET /api/auth/me`
    *   **Description:** Retrieves the profile of the currently authenticated user.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Response (200 OK):**
        ```json
        {
            "id": "user_uuid",
            "email": "user@example.com",
            "display_name": "User Name",
            "avatar_url": "url_to_avatar",
            "bio": "User's bio",
            "preferences": { /* user preferences */ }
            /* other profile fields */
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `404 NOT FOUND`: If the user's profile is not found (should not happen for an authenticated user).
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

7.  **Update Current User Profile**
    *   **Endpoint:** `PATCH /api/auth/me`
    *   **Description:** Updates the profile of the currently authenticated user.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Request Body (partial updates allowed):**
        ```json
        {
            "display_name": "New User Name",
            "avatar_url": "new_avatar_url",
            "bio": "Updated bio",
            "preferences": { /* updated preferences */ }
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "id": "user_uuid",
            "email": "user@example.com",
            "display_name": "New User Name",
            /* other updated profile fields */
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: If the update data is invalid.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

**Search Endpoints (`/search`)**

1.  **Semantic Search**
    *   **Endpoint:** `POST /search/semantic`
    *   **Description:** Performs semantic search across documents within a project.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Request Body:**
        ```json
        {
            "query": "text to search for",
            "project_id": "project_uuid",
            "doc_ids": ["doc_uuid_1", "doc_uuid_2"], // Optional: list of document IDs to search within
            "top_k": 5, // Optional: number of results to return, default is 5
            "include_embeddings": false // Optional: whether to include embeddings in results
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "results": [
                {
                    "document_id": "doc_uuid_1",
                    "chunk_id": "chunk_uuid_within_doc",
                    "text": "relevant text chunk...",
                    "score": 0.85,
                    "metadata": { /* metadata associated with the chunk */ },
                    "embedding": [0.1, 0.2, ...] // Optional, if include_embeddings was true
                }
            ],
            "elapsed_time": 0.123 // Time taken for the search in seconds
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not have access to the specified project.
        *   `400 BAD REQUEST`: If the request is malformed.
        *   `500 INTERNAL SERVER ERROR`: If search or embedding generation fails.

2.  **List Searchable Documents**
    *   **Endpoint:** `GET /search/documents/{project_id}`
    *   **Description:** Lists documents within a project that have been indexed and are available for search.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `project_id` (string, UUID): The ID of the project.
    *   **Query Parameters:**
        *   `limit` (int, optional, default: 100): Maximum number of documents to return.
        *   `offset` (int, optional, default: 0): Number of documents to skip for pagination.
    *   **Response (200 OK):**
        ```json
        [
            {
                "id": "doc_uuid_1",
                "name": "Document Name 1",
                "status": "indexed",
                /* other document metadata */
            },
            {
                "id": "doc_uuid_2",
                "name": "Document Name 2",
                "status": "indexed",
                /* other document metadata */
            }
        ]
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not have access to the project.
        *   `404 NOT FOUND`: If the project is not found.
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

**Project Endpoints (`/api/projects`)**

1.  **Create Project**
    *   **Endpoint:** `POST /api/projects/`
    *   **Description:** Creates a new project for the authenticated user.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Request Body:**
        ```json
        {
            "name": "My New Project",
            "description": "Optional project description",
            "is_public": false, // Optional, default false
            "color": "#FFFFFF", // Optional
            "icon": "project-icon-name", // Optional
            "ai_config": { /* AI model configuration for the project */ }, // Optional
            "memory_type": "short_term", // Optional
            "tags": ["tag1", "tag2"] // Optional
        }
        ```
    *   **Response (201 CREATED):**
        ```json
        {
            "id": "project_uuid",
            "user_id": "user_uuid",
            "name": "My New Project",
            "description": "Optional project description",
            "is_public": false,
            "color": "#FFFFFF",
            "icon": "project-icon-name",
            "ai_config": { /* ... */ },
            "memory_type": "short_term",
            "tags": ["tag1", "tag2"],
            "created_at": "timestamp",
            "updated_at": "timestamp"
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `400 BAD REQUEST`: If the request data is invalid.
        *   `500 INTERNAL SERVER ERROR`: If project creation fails.

2.  **List Projects**
    *   **Endpoint:** `GET /api/projects/`
    *   **Description:** Retrieves all projects for the currently authenticated user.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Query Parameters:**
        *   `limit` (int, optional, default: 100): Maximum number of projects to return.
        *   `offset` (int, optional, default: 0): Number of projects to skip for pagination.
    *   **Response (200 OK):**
        ```json
        [
            {
                "id": "project_uuid_1",
                "name": "Project Alpha",
                /* ... other project fields ... */
            },
            {
                "id": "project_uuid_2",
                "name": "Project Beta",
                /* ... other project fields ... */
            }
        ]
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

3.  **Get Project**
    *   **Endpoint:** `GET /api/projects/{project_id}`
    *   **Description:** Retrieves a specific project by its ID.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `project_id` (string, UUID): The ID of the project.
    *   **Response (200 OK):**
        ```json
        {
            "id": "project_uuid",
            "user_id": "user_uuid",
            "name": "My Project",
            /* ... other project fields ... */
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not own the project and it's not public or shared.
        *   `404 NOT FOUND`: If the project is not found.
        *   `500 INTERNAL SERVER ERROR`: If an unexpected server error occurs.

4.  **Update Project**
    *   **Endpoint:** `PATCH /api/projects/{project_id}`
    *   **Description:** Updates an existing project.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `project_id` (string, UUID): The ID of the project to update.
    *   **Request Body (partial updates allowed):**
        ```json
        {
            "name": "Updated Project Name",
            "description": "New description",
            "is_public": true
            /* other updatable fields */
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "id": "project_uuid",
            "name": "Updated Project Name",
            /* ... other updated project fields ... */
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: If the update data is invalid.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user is not authorized to update the project.
        *   `404 NOT FOUND`: If the project is not found.
        *   `500 INTERNAL SERVER ERROR`: If the update fails.

5.  **Delete Project**
    *   **Endpoint:** `DELETE /api/projects/{project_id}`
    *   **Description:** Deletes a project. Only the project owner can perform this action.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `project_id` (string, UUID): The ID of the project to delete.
    *   **Response (204 NO CONTENT):** Empty response on successful deletion.
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user is not the owner of the project.
        *   `404 NOT FOUND`: If the project is not found.
        *   `500 INTERNAL SERVER ERROR`: If deletion fails.

**Health Check Endpoints (`/health`)**

1.  **Basic Health Check**
    *   **Endpoint:** `GET /health`
    *   **Description:** Provides a basic health status of the application.
    *   **Response (200 OK):**
        ```json
        {
            "status": "healthy",
            "version": "0.1.0", // Example version
            "environment": "development" // Example environment
        }
        ```

2.  **Database Health Check**
    *   **Endpoint:** `GET /health/db`
    *   **Description:** Checks the health and connectivity of the database.
    *   **Response (200 OK if healthy):**
        ```json
        {
            "status": "healthy",
            "database": "connected",
            "details": { /* e.g., simple query result */ }
        }
        ```
    *   **Response (if unhealthy):**
        ```json
        {
            "status": "unhealthy",
            "database": "disconnected",
            "error": "Error message"
        }
        ```

3.  **Storage Service Health Check**
    *   **Endpoint:** `GET /health/storage`
    *   **Description:** Checks the health and connectivity of the storage service.
    *   **Response (200 OK if healthy):**
        ```json
        {
            "status": "healthy",
            "storage": "connected"
        }
        ```
    *   **Response (if unhealthy):**
        ```json
        {
            "status": "unhealthy",
            "storage": "disconnected",
            "error": "Error message"
        }
        ```

**Document Management Endpoints (`/api/doc`)**

1.  **Generate Upload URL (Legacy)**
    *   **Endpoint:** `POST /api/doc/upload`
    *   **Description:** Generates a presigned URL for uploading a document directly to storage. (Considered legacy, `/upload-complete` is preferred for direct uploads).
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
        *   `Content-Type`: Can be `application/json` or `multipart/form-data`.
    *   **Request Body (JSON):**
        ```json
        {
            "file_name": "mydocument.pdf",
            "content_type": "application/pdf",
            "project_id": "project_uuid"
        }
        ```
    *   **Request Body (Form Data):**
        *   `file_name`: "mydocument.pdf"
        *   `content_type`: "application/pdf"
        *   `project_id`: "project_uuid"
    *   **Response (200 OK):**
        ```json
        {
            "presigned_url": "s3_presigned_upload_url",
            "file_key": "project_id/uuid-mydocument.pdf", // Path in storage
            "bucket": "documents", // Storage bucket name
            "document_id": "project_id/uuid-mydocument.pdf" // Same as file_key
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Missing required fields or unsupported file type.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `500 INTERNAL SERVER ERROR`: If URL generation fails.

2.  **Confirm Upload and Start Processing**
    *   **Endpoint:** `POST /api/doc/confirm`
    *   **Description:** Confirms that a document has been uploaded (typically after using a presigned URL) and triggers background processing (e.g., text extraction, embedding).
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
        *   `Content-Type`: `application/json`.
    *   **Request Body:**
        ```json
        {
            "file_name": "mydocument.pdf",
            "file_key": "project_id/uuid-mydocument.pdf", // The path in storage
            "project_id": "project_uuid",
            "bucket": "documents" // Storage bucket where file was uploaded
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "message": "Document processing started",
            "document_id": "document_uuid_created_in_db", // ID of the document record in database
            "status": "processing"
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Missing required fields or invalid data.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user doesn't have access to the project.
        *   `404 NOT FOUND`: If the project is not found.
        *   `500 INTERNAL SERVER ERROR`: If an error occurs.

3.  **List Documents in Project**
    *   **Endpoint:** `GET /api/doc/{project_id}/list`
    *   **Description:** Retrieves a list of documents associated with a specific project.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `project_id` (string, UUID): The ID of the project.
    *   **Query Parameters:**
        *   `limit` (int, optional, default: 100): Maximum number of documents.
        *   `offset` (int, optional, default: 0): Offset for pagination.
    *   **Response (200 OK):**
        ```json
        [
            {
                "id": "doc_uuid_1",
                "project_id": "project_uuid",
                "file_name": "document1.pdf",
                "status": "completed", // or "processing", "failed"
                "file_url": "url_to_file_in_storage",
                "created_at": "timestamp",
                "updated_at": "timestamp"
                /* other document metadata */
            }
        ]
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not have access to the project.
        *   `404 NOT FOUND`: If the project is not found.
        *   `500 INTERNAL SERVER ERROR`: If an error occurs.

4.  **Delete Document**
    *   **Endpoint:** `DELETE /api/doc/{document_id}`
    *   **Description:** Deletes a document and its associated data (e.g., embeddings).
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `document_id` (string, UUID): The ID of the document to delete.
    *   **Response (200 OK):**
        ```json
        {
            "message": "Document deleted successfully",
            "document_id": "document_uuid"
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user is not authorized to delete the document.
        *   `404 NOT FOUND`: If the document is not found.
        *   `500 INTERNAL SERVER ERROR`: If deletion fails.

5.  **Upload File and Process (Direct Upload)**
    *   **Endpoint:** `POST /api/doc/upload-complete`
    *   **Description:** Directly uploads a file to the server, stores it, and queues it for processing (text extraction, embedding). This is generally preferred over the two-step presigned URL process for simpler client implementations.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
        *   `Content-Type: multipart/form-data`
    *   **Request Body (Form Data):**
        *   `file`: The file to upload.
        *   `project_id`: (string, UUID) The ID of the project to associate the document with.
        *   `file_name`: (string, optional) Original name of the file. If not provided, `file.filename` will be used.
    *   **Response (202 ACCEPTED):**
        ```json
        {
            "message": "File uploaded and processing started.",
            "document_id": "new_document_uuid",
            "file_name": "uploaded_file.pdf",
            "status_url": "/api/doc/new_document_uuid" // URL to check processing status
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Missing file, project_id, or unsupported file type.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If user cannot access the project.
        *   `404 NOT FOUND`: If project not found.
        *   `500 INTERNAL SERVER ERROR`: If file upload or processing initiation fails.

6.  **Get Document Details and Status**
    *   **Endpoint:** `GET /api/doc/{document_id}`
    *   **Description:** Retrieves details and the current processing status of a specific document. Uses a short-lived cache for documents in "processing" state.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `document_id` (string, UUID): The ID of the document.
    *   **Response (200 OK):**
        ```json
        {
            "id": "doc_uuid_1",
            "project_id": "project_uuid",
            "file_name": "document1.pdf",
            "status": "completed", // or "processing", "failed", "pending"
            "file_url": "url_to_file_in_storage",
            "created_at": "timestamp",
            "updated_at": "timestamp",
            "chunks_count": 15, // Example field
            "error_message": null // Example field, populated if status is "failed"
            /* other document metadata */
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not have access to the document.
        *   `404 NOT FOUND`: If the document is not found.
        *   `500 INTERNAL SERVER ERROR`: If an error occurs.

**Chat Endpoints (`/api/chat`)**

1.  **Create Chat Session**
    *   **Endpoint:** `POST /api/chat/sessions`
    *   **Description:** Creates a new chat session associated with a project.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Request Body:**
        ```json
        {
            "project_id": "project_uuid",
            "title": "Chat about Project X", // Optional
            "summary": "Initial summary of the chat", // Optional
            "model_config": { /* AI model configuration for this session */ } // Optional
        }
        ```
    *   **Response (201 CREATED):**
        ```json
        {
            "id": "session_uuid",
            "project_id": "project_uuid",
            "user_id": "user_uuid",
            "title": "Chat about Project X",
            "summary": "Initial summary of the chat",
            "ai_config": { /* ... */ },
            "created_at": "timestamp",
            "updated_at": "timestamp"
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Invalid `project_id` format.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not have access to the project.
        *   `404 NOT FOUND`: If the project is not found.
        *   `500 INTERNAL SERVER ERROR`: If session creation fails.

2.  **List Chat Sessions for Project**
    *   **Endpoint:** `GET /api/chat/sessions/project/{project_id}`
    *   **Description:** Lists all chat sessions for a given project that belong to the current user.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `project_id` (string, UUID): The ID of the project.
    *   **Query Parameters:**
        *   `limit` (int, optional, default: 100, max: 1000): Maximum number of sessions.
        *   `offset` (int, optional, default: 0): Offset for pagination.
    *   **Response (200 OK):**
        ```json
        [
            {
                "id": "session_uuid_1",
                "project_id": "project_uuid",
                /* ... other session fields ... */
            }
        ]
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Invalid `project_id` format.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `500 INTERNAL SERVER ERROR`: If an error occurs.

3.  **Get Chat Session**
    *   **Endpoint:** `GET /api/chat/sessions/{session_id}`
    *   **Description:** Retrieves details of a specific chat session.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `session_id` (string, UUID): The ID of the chat session.
    *   **Response (200 OK):**
        ```json
        {
            "id": "session_uuid",
            /* ... other session fields ... */
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Invalid `session_id` format.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not own the session.
        *   `404 NOT FOUND`: If the session is not found.
        *   `500 INTERNAL SERVER ERROR`: If an error occurs.

4.  **Update Chat Session**
    *   **Endpoint:** `PATCH /api/chat/sessions/{session_id}`
    *   **Description:** Updates metadata of a chat session (e.g., title, summary).
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `session_id` (string, UUID): The ID of the chat session.
    *   **Request Body (partial updates allowed):**
        ```json
        {
            "title": "Updated Chat Title",
            "summary": "New summary of the chat",
            "model_config": { /* updated AI config */ }
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "id": "session_uuid",
            "title": "Updated Chat Title",
            /* ... other updated session fields ... */
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Invalid `session_id` format or no update data provided.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not own the session.
        *   `404 NOT FOUND`: If the session is not found.
        *   `500 INTERNAL SERVER ERROR`: If the update fails.

5.  **Delete Chat Session**
    *   **Endpoint:** `DELETE /api/chat/sessions/{session_id}`
    *   **Description:** Deletes a chat session and all its associated messages.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `session_id` (string, UUID): The ID of the chat session.
    *   **Response (204 NO CONTENT):** Empty response on successful deletion.
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Invalid `session_id` format.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not own the session.
        *   `404 NOT FOUND`: If the session is not found.
        *   `500 INTERNAL SERVER ERROR`: If deletion fails.

6.  **List Chat Messages**
    *   **Endpoint:** `GET /api/chat/messages/{session_id}`
    *   **Description:** Retrieves messages from a specific chat session.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `session_id` (string, UUID): The ID of the chat session.
    *   **Query Parameters:**
        *   `limit` (int, optional, default: 100, max: 1000): Maximum number of messages.
        *   `offset` (int, optional, default: 0): Offset for pagination.
    *   **Response (200 OK):**
        ```json
        [
            {
                "id": "message_uuid_1",
                "session_id": "session_uuid",
                "role": "user", // or "assistant", "system"
                "content": "User's message content",
                "created_at": "timestamp",
                "metadata": { /* optional message metadata */ }
            }
        ]
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Invalid `session_id` format.
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not have access to the session.
        *   `404 NOT FOUND`: If the session is not found.
        *   `500 INTERNAL SERVER ERROR`: If an error occurs.

7.  **Create Chat Message**
    *   **Endpoint:** `POST /api/chat/messages`
    *   **Description:** Adds a new message to a chat session. Typically used for user messages before requesting an AI completion.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Request Body:**
        ```json
        {
            "session_id": "session_uuid",
            "role": "user", // "user" or "assistant" (if manually adding assistant's prior turn)
            "content": "This is my message.",
            "metadata": { /* optional message metadata */ }
        }
        ```
    *   **Response (201 CREATED):**
        ```json
        {
            "id": "new_message_uuid",
            "session_id": "session_uuid",
            "role": "user",
            "content": "This is my message.",
            "created_at": "timestamp",
            "metadata": { /* ... */ }
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Invalid request data (e.g., `session_id` format).
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not have access to the session.
        *   `404 NOT FOUND`: If the session is not found.
        *   `500 INTERNAL SERVER ERROR`: If message creation fails.

8.  **Create Chat Completion (Streaming)**
    *   **Endpoint:** `POST /api/chat/completions`
    *   **Description:** Sends the current chat context (session messages) to an AI model and streams back the response.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Request Body:**
        ```json
        {
            "session_id": "session_uuid",
            "model": "gpt-4", // Optional: override session's default model
            "temperature": 0.7, // Optional
            "max_tokens": 150, // Optional
            "stream": true, // Should be true for streaming
            "messages": [ // Optional: if you want to send a specific set of messages instead of relying on session_id history
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"},
                {"role": "user", "content": "Tell me a joke."}
            ]
        }
        ```
    *   **Response (200 OK with `text/event-stream`):**
        A stream of Server-Sent Events (SSE). Each event might look like:
        ```
        data: {"id": "chatcmpl-xxxx", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4", "choices": [{"index": 0, "delta": {"content": "Why did "}, "finish_reason": null}]}

        data: {"id": "chatcmpl-xxxx", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4", "choices": [{"index": 0, "delta": {"content": "the scarecrow "}, "finish_reason": null}]}

        data: {"id": "chatcmpl-xxxx", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4", "choices": [{"index": 0, "delta": {"content": "win an award?"}, "finish_reason": null}]}

        data: {"id": "chatcmpl-xxxx", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4", "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]}

        data: [DONE]
        ```
        If `stream: false` (not recommended for chat interfaces):
        ```json
        {
            "id": "chatcmpl-xxxx",
            "object": "chat.completion",
            "created": 1677652288,
            "model": "gpt-4",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "Why did the scarecrow win an award? Because he was outstanding in his field!"
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": 20,
                "completion_tokens": 15,
                "total_tokens": 35
            }
        }
        ```
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Invalid request data (e.g., `session_id` format).
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user does not have access to the session or project.
        *   `404 NOT FOUND`: If the session or project is not found.
        *   `500 INTERNAL SERVER ERROR`: If AI completion fails or an error occurs during streaming.

**Embedding Endpoints (`/api/embed`)**

1.  **Embed Document**
    *   **Endpoint:** `POST /api/embed/{document_id}`
    *   **Description:** Triggers a background task to generate embeddings for a specific document.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `document_id` (string, UUID): The ID of the document to embed.
    *   **Response (200 OK):**
        ```json
        {
            "message": "Document embedding started",
            "document_id": "document_uuid"
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user is not authorized to embed this document (e.g., doesn't own the project).
        *   `404 NOT FOUND`: If the document or its project is not found.
        *   `500 INTERNAL SERVER ERROR`: If starting the embedding task fails.

2.  **Batch Embed Documents for Project**
    *   **Endpoint:** `POST /api/embed/batch/{project_id}`
    *   **Description:** Triggers background tasks to embed all documents in a project that haven't been embedded yet.
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Path Parameters:**
        *   `project_id` (string, UUID): The ID of the project.
    *   **Response (200 OK):**
        ```json
        {
            "message": "Started embedding X documents",
            "document_count": 0 // Number of documents for which embedding tasks were started
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `403 FORBIDDEN`: If the user is not authorized to access this project.
        *   `404 NOT FOUND`: If the project is not found.
        *   `500 INTERNAL SERVER ERROR`: If starting the batch embedding fails.

**Payment Endpoints (`/api/payment`)**

1.  **Create Stripe Checkout Session**
    *   **Endpoint:** `POST /api/payment/create-checkout-session`
    *   **Description:** Creates a Stripe checkout session for a product (e.g., a lifetime deal).
    *   **Request Headers:**
        *   `Authorization: Bearer <access_token>`
    *   **Request Body:**
        ```json
        {
            "success_url": "https://yourapp.com/payment-success?session_id={CHECKOUT_SESSION_ID}",
            "cancel_url": "https://yourapp.com/payment-cancelled"
        }
        ```
    *   **Response (200 OK):**
        ```json
        {
            "checkout_url": "stripe_checkout_session_url",
            "session_id": "stripe_checkout_session_id"
        }
        ```
    *   **Error Responses:**
        *   `401 UNAUTHORIZED`: If the user is not authenticated.
        *   `500 INTERNAL SERVER ERROR`: If creating the checkout session fails.

2.  **Stripe Webhook**
    *   **Endpoint:** `POST /api/payment/webhook`
    *   **Description:** Handles incoming webhook notifications from Stripe to update payment statuses, user plans, etc. This endpoint should be protected and only accessible by Stripe.
    *   **Request Headers:**
        *   `Stripe-Signature`: Provided by Stripe for webhook signature verification.
    *   **Request Body:** Raw event payload from Stripe (JSON).
    *   **Response (200 OK):**
        ```json
        {
            "status": "success"
        }
        ```
        *(Or an appropriate error response if processing fails, e.g., 400 for bad signature/payload).*
    *   **Error Responses:**
        *   `400 BAD REQUEST`: Webhook error (e.g., invalid signature, payload processing error).

---

**Suggestions for Backend Improvements:**

After reviewing the API structure, here are some suggestions to enhance efficiency, scalability, and modularity, keeping in mind the goal of creating the "best app out there":

1.  **API Versioning:**
    *   **Current State:** No explicit versioning in the URL prefix (e.g., `/api/v1/...`).
    *   **Suggestion:** Introduce API versioning in the URL (e.g., `/api/v1/auth`, `/api/v1/projects`). This allows for future non-breaking changes and smooth transitions for clients.
        *   **Benefit:** Easier to evolve the API without breaking existing frontend applications.

2.  **Consistent Response Structure:**
    *   **Current State:** While generally good, there are minor inconsistencies (e.g., some delete operations return 204, others 200 with a message). The `SearchResponse` has `elapsed_time`, which is good, but other potentially long operations don't have this.
    *   **Suggestion:** Standardize all API responses. A common structure could be:
        ```json
        {
            "status": "success", // or "error"
            "data": { /* actual response data for success */ },
            "message": "Optional descriptive message", // For success or error
            "error": { // Present if status is "error"
                "code": "ERROR_CODE_SLUG",
                "details": "More specific error details"
            },
            "pagination": { // If applicable
                "total_items": 100,
                "limit": 10,
                "offset": 0,
                "next_offset": 10, // or null
                "prev_offset": null // or 0
            }
        }
        ```
    *   **Benefit:** Predictable responses for the frontend, easier error handling, and consistent metadata like pagination.

3.  **Enhanced Input Validation and Error Reporting:**
    *   **Current State:** Pydantic is used for validation, which is excellent. Error messages are generally informative.
    *   **Suggestion:** For 400 Bad Request errors due to validation, ensure the response body clearly indicates *which* fields failed validation and why. Pydantic's `ValidationError` can be caught and transformed into a structured error response.
        ```json
        // Example 400 Bad Request for validation error
        {
            "status": "error",
            "message": "Input validation failed",
            "error": {
                "code": "VALIDATION_ERROR",
                "details": [
                    {"field": "email", "message": "Invalid email format"},
                    {"field": "password", "message": "Password too short"}
                ]
            }
        }
        ```
    *   **Benefit:** Makes it much easier for frontend developers to understand and fix input errors.

4.  **Asynchronous Task Management & Status Reporting:**
    *   **Current State:** Background tasks are used for embeddings and document processing (`/api/doc/confirm`, `/api/doc/upload-complete`, `/api/embed/...`). The `/api/doc/{document_id}` endpoint provides status.
    *   **Suggestion:**
        *   Standardize the response for starting any long-running background task. It should always return a task ID or a URL to check the status.
        *   Implement a generic `/api/tasks/{task_id}` endpoint to check the status of *any* background task (not just document processing). This task status endpoint could provide progress percentage, current step, ETA if possible, and final result or error.
        *   Consider using WebSockets or Server-Sent Events (SSE) for real-time progress updates on long-running tasks, especially for document processing and batch embeddings, rather than relying solely on polling.
    *   **Benefit:** Better user experience on the frontend by providing more granular feedback on background operations. Centralized task management.

5.  **Refined Document Upload Process:**
    *   **Current State:** `/api/doc/upload` (presigned URL) and `/api/doc/confirm` feel a bit clunky. `/api/doc/upload-complete` is better for direct uploads.
    *   **Suggestion:**
        *   Clearly demarcate the preferred upload method. If `/upload-complete` is preferred, perhaps deprecate or simplify the presigned URL flow.
        *   The response from `/api/doc/upload-complete` already includes a `status_url`, which is good. Ensure this is consistently used.
        *   The caching mechanism in `doc.py` for document status is a good start. Ensure its TTLs are appropriate and consider if a more robust caching solution (like Redis) might be needed at scale, especially if many users are uploading/checking statuses.
    *   **Benefit:** Simplified and more robust file uploading experience.

6.  **Modularity of Services:**
    *   **Current State:** Services like `DatabaseService`, `EmbeddingService`, `ChatService` are defined. Dependencies are injected using FastAPI's `Depends`. This is good.
    *   **Suggestion:** Continue to enforce strict separation of concerns. Routers should only handle request/response validation and delegate business logic to service classes. Service classes should be stateless if possible or manage their state carefully.
        *   For instance, the `embeddings.py` router directly uses a Supabase client. While Supabase might be the current backend, abstracting this further into the `DatabaseService` or a dedicated `EmbeddingMetadataService` might be beneficial if you ever wanted to change how embedding metadata is stored or if the embedding process itself becomes more complex (e.g., multiple embedding models, versioning embeddings).
    *   **Benefit:** Improved testability, maintainability, and flexibility to swap out underlying implementations.

7.  **Configuration Management:**
    *   **Current State:** Uses environment variables and `.env` files, with `settings` object from `app.config.settings`. This follows best practices.
    *   **Suggestion:** Ensure *all* external service URLs, keys, model names (e.g., OpenAI models in `ChatService`), and tunable parameters (like `CACHE_TTL_SECONDS` in `doc.py`) are configurable via environment variables with sensible defaults. The `CURSOR_RULES.md` emphasizes this, so it's about consistent application.
    *   **Benefit:** Adherence to 12-factor app principles, easier deployment across different environments.

8.  **Security Enhancements:**
    *   **Current State:** Uses `get_current_user` dependency for authentication, which is good. Authorization checks (project ownership, public access) are present in many endpoints.
    *   **Suggestion:**
        *   **Rate Limiting:** Implement rate limiting on sensitive endpoints (login, password reset, resource creation) to prevent abuse. FastAPI middleware can be used for this.
        *   **Input Sanitization:** While Pydantic handles type validation, ensure that any data destined for direct use in raw SQL queries (if any, though ORM/query builders are preferred), OS commands, or rendered in HTML (if backend ever does this) is thoroughly sanitized.
        *   **Permissions Model:** For more complex applications, consider a more granular role-based access control (RBAC) or attribute-based access control (ABAC) system if project sharing or team features become more advanced than the current `shared_objects` table implies. This could be an extension of the `DatabaseService` or a new `PermissionService`.
    *   **Benefit:** Increased security and robustness.

9.  **Scalability Considerations:**
    *   **Current State:** FastAPI with `async/await` is a good foundation for I/O-bound scalability. Background tasks help offload work.
    *   **Suggestion:**
        *   **Database Connection Pooling:** Ensure the database connection (e.g., to Supabase) is managed efficiently with proper connection pooling, especially with `asyncpg` if using PostgreSQL. `DatabaseService` initialization should handle this.
        *   **Caching Strategy:** Beyond the document status cache, identify other frequently accessed, rarely changing data that could be cached (e.g., project details if they are read very often). Use Redis or a similar distributed cache for this if the application scales horizontally.
        *   **Vector Store Optimization:** As the number of documents and embeddings grows, ensure the `VectorStoreService` interactions are optimized (e.g., using appropriate indexing in the vector DB, filtering before searching where possible). The current `search_by_embedding` with a `filter` option is good.
        *   **Statelessness:** Strive to keep API instances as stateless as possible to facilitate horizontal scaling. Store shared state in external services (DB, cache, message queue).
    *   **Benefit:** Ability to handle a growing number of users and data.

10. **Logging and Monitoring:**
    *   **Current State:** Logging is implemented. The `request_context` in `chat.py` for adding `request_id` to logs is a good practice.
    *   **Suggestion:**
        *   Ensure structured logging (e.g., JSON format) throughout the application. This makes logs much easier to parse, search, and analyze in log management systems.
        *   Include `request_id` in *all* log messages related to a request, not just in the chat router. This can be done with a FastAPI middleware.
        *   Log key business events, not just errors (e.g., project created, document processed successfully).
        *   Integrate with a monitoring and alerting system (e.g., Prometheus, Grafana, Sentry) to track API performance, error rates, and system health. The existing `/health` endpoints are a good start for this.
    *   **Benefit:** Easier debugging, proactive issue identification, and operational visibility.

11. **Payment Webhook Robustness:**
    *   **Current State:** `payments.py` handles Stripe webhooks.
    *   **Suggestion:**
        *   **Idempotency:** Ensure webhook handling is idempotent. Stripe might retry webhooks, so processing the same event multiple times should not cause issues (e.g., granting a plan multiple times). Check if an event ID has already been processed.
        *   **Background Processing:** For any non-trivial logic in webhook handlers (like multiple database updates or external calls), consider offloading it to a background task to respond to Stripe quickly (within their recommended timeout) and prevent holding up the webhook.
        *   **Signature Verification:** The `stripe_signature: str = Header(None)` and `handle_webhook_event` implies this is being done, which is critical.
    *   **Benefit:** Reliable processing of payment events.

12. **Code Duplication in Routers (Minor):**
    *   **Observation:** Some routers (e.g., `projects.py`, `search.py`) have similar logic for checking project ownership or shared access before allowing an operation.
    *   **Suggestion:** This logic could potentially be extracted into a reusable dependency. For example, a `get_project_for_user(project_id: str, user: Dict, required_permission: str = "read")` dependency that fetches the project and performs the access check, raising HTTPException if not authorized.
    *   **Benefit:** DRYer code, easier to maintain permission logic.

</rewritten_file> 