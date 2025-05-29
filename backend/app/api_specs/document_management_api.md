# Document Management API Specification

## Overview
The Document Management API provides comprehensive functionality for uploading, processing, indexing, and managing documents within projects. It supports various file formats and integrates with vector databases for semantic search capabilities.

## Base URL
```
/api/documents
```

## Authentication
All endpoints require Bearer token authentication unless specified otherwise.

## Data Models

### Document
```json
{
  "id": "string (UUID)",
  "name": "string (1-255 chars)",
  "description": "string (optional)",
  "storage_path": "string",
  "storage_bucket": "string",
  "file_type": "string (optional)",
  "file_size": "integer (optional)",
  "status": "string (processing|indexed|failed)",
  "processing_error": "string (optional)",
  "pinecone_namespace": "string (optional)",
  "chunk_count": "integer (default: 0)",
  "metadata": "object (optional)",
  "project_id": "string (UUID)",
  "user_id": "string (UUID)",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

### Document Status
- `processing`: Document is being processed/indexed
- `indexed`: Document has been successfully processed and indexed
- `failed`: Document processing failed

### Supported File Types
- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Text files (`.txt`)
- Markdown (`.md`)
- CSV (`.csv`)
- JSON (`.json`)

## API Endpoints

### 1. Generate Upload URL
Generate a presigned URL for uploading a document.

**Endpoint:** `POST /api/documents/upload-url`

**Request Body:**
```json
{
  "file_name": "string (required)",
  "content_type": "string (required)",
  "project_id": "string (UUID, required)"
}
```

**Response:** `200 OK`
```json
{
  "presigned_url": "string",
  "file_key": "string",
  "bucket": "string",
  "document_id": "string (UUID)",
  "expires_in": "integer (seconds)"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file type or missing required fields
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: Project not found

### 2. Confirm Upload
Confirm a document upload and start processing.

**Endpoint:** `POST /api/documents/confirm`

**Request Body:**
```json
{
  "file_key": "string (required)",
  "bucket": "string (required)",
  "project_id": "string (UUID, required)",
  "name": "string (optional)",
  "description": "string (optional)",
  "metadata": "object (optional)"
}
```

**Response:** `201 Created`
```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string",
  "storage_path": "string",
  "storage_bucket": "string",
  "file_type": "string",
  "file_size": "integer",
  "status": "processing",
  "processing_error": null,
  "pinecone_namespace": "string",
  "chunk_count": 0,
  "metadata": "object",
  "project_id": "string (UUID)",
  "user_id": "string (UUID)",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Invalid or missing authentication token
- `404 Not Found`: Project or file not found

### 3. Direct Upload
Upload a document directly (alternative to presigned URL flow).

**Endpoint:** `POST /api/documents/upload`

**Request Body:** `multipart/form-data`
- `file`: File (required)
- `project_id`: string (UUID, required)
- `name`: string (optional)
- `description`: string (optional)

**Response:** `201 Created`
```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string",
  "storage_path": "string",
  "storage_bucket": "string",
  "file_type": "string",
  "file_size": "integer",
  "status": "processing",
  "processing_error": null,
  "pinecone_namespace": "string",
  "chunk_count": 0,
  "metadata": "object",
  "project_id": "string (UUID)",
  "user_id": "string (UUID)",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file type or missing required fields
- `401 Unauthorized`: Invalid or missing authentication token
- `413 Payload Too Large`: File size exceeds limit

### 4. Get Document
Retrieve a specific document by ID.

**Endpoint:** `GET /api/documents/{document_id}`

**Path Parameters:**
- `document_id`: string (UUID, required)

**Response:** `200 OK`
```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string",
  "storage_path": "string",
  "storage_bucket": "string",
  "file_type": "string",
  "file_size": "integer",
  "status": "string",
  "processing_error": "string",
  "pinecone_namespace": "string",
  "chunk_count": "integer",
  "metadata": "object",
  "project_id": "string (UUID)",
  "user_id": "string (UUID)",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have access to this document
- `404 Not Found`: Document not found

### 5. Update Document
Update a document's metadata.

**Endpoint:** `PATCH /api/documents/{document_id}`

**Path Parameters:**
- `document_id`: string (UUID, required)

**Request Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "metadata": "object (optional)"
}
```

**Response:** `200 OK`
```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string",
  "storage_path": "string",
  "storage_bucket": "string",
  "file_type": "string",
  "file_size": "integer",
  "status": "string",
  "processing_error": "string",
  "pinecone_namespace": "string",
  "chunk_count": "integer",
  "metadata": "object",
  "project_id": "string (UUID)",
  "user_id": "string (UUID)",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have access to this document
- `404 Not Found`: Document not found

### 6. Delete Document
Delete a document and its associated data.

**Endpoint:** `DELETE /api/documents/{document_id}`

**Path Parameters:**
- `document_id`: string (UUID, required)

**Response:** `204 No Content`

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have access to this document
- `404 Not Found`: Document not found

### 7. List Project Documents
List all documents in a project with pagination.

**Endpoint:** `GET /api/documents/project/{project_id}`

**Path Parameters:**
- `project_id`: string (UUID, required)

**Query Parameters:**
- `limit`: integer (1-100, default: 100)
- `offset`: integer (min: 0, default: 0)
- `status`: string (optional, filter by status)
- `file_type`: string (optional, filter by file type)
- `search`: string (optional, search in name/description)

**Response:** `200 OK`
```json
{
  "documents": [
    {
      "id": "string (UUID)",
      "name": "string",
      "description": "string",
      "storage_path": "string",
      "storage_bucket": "string",
      "file_type": "string",
      "file_size": "integer",
      "status": "string",
      "processing_error": "string",
      "pinecone_namespace": "string",
      "chunk_count": "integer",
      "metadata": "object",
      "project_id": "string (UUID)",
      "user_id": "string (UUID)",
      "created_at": "string (ISO 8601)",
      "updated_at": "string (ISO 8601)"
    }
  ],
  "total": "integer",
  "limit": "integer",
  "offset": "integer",
  "has_more": "boolean"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have access to this project
- `404 Not Found`: Project not found

### 8. Reprocess Document
Reprocess a document that may have failed indexing.

**Endpoint:** `POST /api/documents/{document_id}/reprocess`

**Path Parameters:**
- `document_id`: string (UUID, required)

**Response:** `200 OK`
```json
{
  "id": "string (UUID)",
  "name": "string",
  "description": "string",
  "storage_path": "string",
  "storage_bucket": "string",
  "file_type": "string",
  "file_size": "integer",
  "status": "processing",
  "processing_error": null,
  "pinecone_namespace": "string",
  "chunk_count": "integer",
  "metadata": "object",
  "project_id": "string (UUID)",
  "user_id": "string (UUID)",
  "created_at": "string (ISO 8601)",
  "updated_at": "string (ISO 8601)"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have access to this document
- `404 Not Found`: Document not found
- `409 Conflict`: Document is already being processed

### 9. Get Document Content
Retrieve the processed content/chunks of a document.

**Endpoint:** `GET /api/documents/{document_id}/content`

**Path Parameters:**
- `document_id`: string (UUID, required)

**Query Parameters:**
- `format`: string (text|chunks, default: text)
- `limit`: integer (1-100, default: 100, only for chunks format)
- `offset`: integer (min: 0, default: 0, only for chunks format)

**Response:** `200 OK`

For `format=text`:
```json
{
  "content": "string",
  "document_id": "string (UUID)",
  "extracted_at": "string (ISO 8601)"
}
```

For `format=chunks`:
```json
{
  "chunks": [
    {
      "id": "string",
      "content": "string",
      "metadata": "object",
      "embedding_id": "string",
      "chunk_index": "integer"
    }
  ],
  "total": "integer",
  "limit": "integer",
  "offset": "integer",
  "has_more": "boolean"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have access to this document
- `404 Not Found`: Document not found
- `422 Unprocessable Entity`: Document not yet processed

### 10. Download Document
Get a presigned URL to download the original document.

**Endpoint:** `GET /api/documents/{document_id}/download`

**Path Parameters:**
- `document_id`: string (UUID, required)

**Response:** `200 OK`
```json
{
  "download_url": "string",
  "expires_in": "integer (seconds)",
  "file_name": "string",
  "file_size": "integer",
  "content_type": "string"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: User doesn't have access to this document
- `404 Not Found`: Document not found

### 11. Bulk Operations

#### Bulk Delete Documents
**Endpoint:** `DELETE /api/documents/bulk`

**Request Body:**
```json
{
  "document_ids": ["string (UUID)"],
  "project_id": "string (UUID, required)"
}
```

**Response:** `200 OK`
```json
{
  "deleted": ["string (UUID)"],
  "failed": [
    {
      "document_id": "string (UUID)",
      "error": "string"
    }
  ],
  "total_requested": "integer",
  "total_deleted": "integer",
  "total_failed": "integer"
}
```

#### Bulk Reprocess Documents
**Endpoint:** `POST /api/documents/bulk/reprocess`

**Request Body:**
```json
{
  "document_ids": ["string (UUID)"],
  "project_id": "string (UUID, required)"
}
```

**Response:** `200 OK`
```json
{
  "reprocessing": ["string (UUID)"],
  "failed": [
    {
      "document_id": "string (UUID)",
      "error": "string"
    }
  ],
  "total_requested": "integer",
  "total_reprocessing": "integer",
  "total_failed": "integer"
}
```

### 12. Document Statistics
Get statistics about documents in a project.

**Endpoint:** `GET /api/documents/project/{project_id}/stats`

**Path Parameters:**
- `project_id`: string (UUID, required)

**Response:** `200 OK`
```json
{
  "total_documents": "integer",
  "status_breakdown": {
    "processing": "integer",
    "indexed": "integer",
    "failed": "integer"
  },
  "file_type_breakdown": {
    "pdf": "integer",
    "docx": "integer",
    "txt": "integer",
    "md": "integer",
    "csv": "integer",
    "json": "integer"
  },
  "total_size_bytes": "integer",
  "total_chunks": "integer",
  "last_upload": "string (ISO 8601, optional)"
}
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

### Common Error Codes
- `INVALID_FILE_TYPE`: Unsupported file format
- `FILE_TOO_LARGE`: File exceeds size limit
- `PROCESSING_FAILED`: Document processing failed
- `STORAGE_ERROR`: Storage operation failed
- `VALIDATION_ERROR`: Request validation failed
- `PERMISSION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Rate Limiting
- Upload endpoints: 10 requests per minute per user
- List endpoints: 100 requests per minute per user
- Other endpoints: 60 requests per minute per user

## File Size Limits
- Maximum file size: 50MB
- Maximum total storage per project: 1GB (configurable)

## Processing Pipeline
1. **Upload**: File is uploaded to storage
2. **Validation**: File type and size validation
3. **Text Extraction**: Content extraction based on file type
4. **Chunking**: Text is split into manageable chunks
5. **Embedding**: Chunks are converted to vector embeddings
6. **Indexing**: Embeddings are stored in vector database
7. **Completion**: Document status updated to "indexed"

## Webhooks (Optional)
Configure webhooks to receive notifications about document processing events.

**Events:**
- `document.processing.started`
- `document.processing.completed`
- `document.processing.failed`
- `document.deleted`

**Webhook Payload:**
```json
{
  "event": "string",
  "document_id": "string (UUID)",
  "project_id": "string (UUID)",
  "user_id": "string (UUID)",
  "timestamp": "string (ISO 8601)",
  "data": "object"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
// Upload document
const uploadResponse = await fetch('/api/documents/upload-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_name: 'document.pdf',
    content_type: 'application/pdf',
    project_id: 'project-uuid'
  })
});

const { presigned_url, file_key, bucket } = await uploadResponse.json();

// Upload file to presigned URL
await fetch(presigned_url, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': 'application/pdf'
  }
});

// Confirm upload
await fetch('/api/documents/confirm', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    file_key,
    bucket,
    project_id: 'project-uuid',
    name: 'My Document'
  })
});
```

### Python
```python
import requests

# Upload document
upload_response = requests.post(
    '/api/documents/upload-url',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'file_name': 'document.pdf',
        'content_type': 'application/pdf',
        'project_id': 'project-uuid'
    }
)

upload_data = upload_response.json()

# Upload file to presigned URL
with open('document.pdf', 'rb') as f:
    requests.put(
        upload_data['presigned_url'],
        data=f,
        headers={'Content-Type': 'application/pdf'}
    )

# Confirm upload
requests.post(
    '/api/documents/confirm',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'file_key': upload_data['file_key'],
        'bucket': upload_data['bucket'],
        'project_id': 'project-uuid',
        'name': 'My Document'
    }
)
```

## Security Considerations
- All file uploads are scanned for malware
- File content is validated before processing
- Access control enforced at project level
- Presigned URLs have short expiration times
- All operations are logged for audit purposes
- Rate limiting prevents abuse
- File size limits prevent storage abuse
</rewritten_file> 