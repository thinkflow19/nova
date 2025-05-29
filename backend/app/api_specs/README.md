# Nova API Specifications

This directory contains comprehensive API specifications for the Nova project, focusing on document management capabilities.

## Files Overview

### 1. `document_management_api.md`
A comprehensive markdown documentation of the Document Management API including:
- Complete endpoint documentation
- Request/response schemas
- Error handling
- Rate limiting
- Security considerations
- SDK examples in JavaScript/TypeScript and Python
- Processing pipeline explanation

### 2. `document_management_openapi.yaml`
OpenAPI 3.0 specification for the Document Management API that can be used with:
- Swagger UI for interactive documentation
- Code generation tools
- API testing tools
- Integration with development workflows

## Document Management API Features

The Document Management API provides:

### Core Functionality
- **Document Upload**: Presigned URL and direct upload methods
- **Document Processing**: Automatic text extraction, chunking, and vector embedding
- **Document Management**: CRUD operations for documents
- **Content Access**: Retrieve processed content and download originals
- **Bulk Operations**: Batch processing for multiple documents
- **Analytics**: Document statistics and insights

### Supported File Types
- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Text files (`.txt`)
- Markdown (`.md`)
- CSV (`.csv`)
- JSON (`.json`)

### Key Endpoints

#### Upload Flow
1. `POST /api/documents/upload-url` - Generate presigned URL
2. `PUT {presigned_url}` - Upload file to storage
3. `POST /api/documents/confirm` - Confirm upload and start processing

#### Management
- `GET /api/documents/{document_id}` - Get document details
- `PATCH /api/documents/{document_id}` - Update document metadata
- `DELETE /api/documents/{document_id}` - Delete document
- `GET /api/documents/project/{project_id}` - List project documents

#### Content Access
- `GET /api/documents/{document_id}/content` - Get processed content
- `GET /api/documents/{document_id}/download` - Download original file

#### Processing
- `POST /api/documents/{document_id}/reprocess` - Reprocess failed documents

#### Bulk Operations
- `DELETE /api/documents/bulk` - Bulk delete documents
- `POST /api/documents/bulk/reprocess` - Bulk reprocess documents

#### Analytics
- `GET /api/documents/project/{project_id}/stats` - Document statistics

## Authentication

All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Rate Limits

- Upload endpoints: 10 requests/minute per user
- List endpoints: 100 requests/minute per user
- Other endpoints: 60 requests/minute per user

## File Size Limits

- Maximum file size: 50MB
- Maximum total storage per project: 1GB (configurable)

## Processing Pipeline

1. **Upload**: File uploaded to storage
2. **Validation**: File type and size validation
3. **Text Extraction**: Content extraction based on file type
4. **Chunking**: Text split into manageable chunks
5. **Embedding**: Chunks converted to vector embeddings
6. **Indexing**: Embeddings stored in vector database
7. **Completion**: Document status updated to "indexed"

## Error Handling

The API uses standard HTTP status codes and returns structured error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

Common error codes:
- `INVALID_FILE_TYPE`: Unsupported file format
- `FILE_TOO_LARGE`: File exceeds size limit
- `PROCESSING_FAILED`: Document processing failed
- `VALIDATION_ERROR`: Request validation failed
- `PERMISSION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource not found

## Usage Examples

### JavaScript/TypeScript
```typescript
// Generate upload URL
const response = await fetch('/api/documents/upload-url', {
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

const { presigned_url, file_key, bucket } = await response.json();

// Upload file
await fetch(presigned_url, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': 'application/pdf' }
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

# Generate upload URL
response = requests.post(
    '/api/documents/upload-url',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'file_name': 'document.pdf',
        'content_type': 'application/pdf',
        'project_id': 'project-uuid'
    }
)

data = response.json()

# Upload file
with open('document.pdf', 'rb') as f:
    requests.put(
        data['presigned_url'],
        data=f,
        headers={'Content-Type': 'application/pdf'}
    )

# Confirm upload
requests.post(
    '/api/documents/confirm',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'file_key': data['file_key'],
        'bucket': data['bucket'],
        'project_id': 'project-uuid',
        'name': 'My Document'
    }
)
```

## Integration with Existing Nova Backend

The Document Management API integrates with the existing Nova backend:

- **Authentication**: Uses the same JWT-based authentication system
- **Database**: Leverages existing Supabase database with RLS policies
- **Storage**: Integrates with configured storage service (S3/Supabase Storage)
- **Vector Database**: Uses Pinecone for vector embeddings and search
- **Projects**: Documents are associated with existing project entities

## Development and Testing

### Using OpenAPI Specification

1. **Swagger UI**: Import the YAML file into Swagger UI for interactive documentation
2. **Postman**: Import the OpenAPI spec to generate a Postman collection
3. **Code Generation**: Use tools like `openapi-generator` to generate client SDKs
4. **Testing**: Use the specification for contract testing

### Environment Variables

Ensure these environment variables are configured:

```bash
# Storage
STORAGE_BUCKET_NAME=documents
STORAGE_PROVIDER=supabase  # or s3

# Vector Database
PINECONE_API_KEY=your-pinecone-key
PINECONE_ENVIRONMENT=your-environment
PINECONE_INDEX_NAME=your-index

# Processing
MAX_FILE_SIZE_MB=50
MAX_CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

## Security Considerations

- All file uploads are validated for type and size
- Access control enforced at project level through RLS
- Presigned URLs have short expiration times (5 minutes)
- All operations are logged for audit purposes
- Rate limiting prevents abuse
- File content is scanned before processing

## Future Enhancements

Potential future additions to the API:
- Webhook support for processing events
- Advanced search and filtering options
- Document versioning
- Collaborative editing features
- Advanced analytics and insights
- Integration with external document sources

## Support

For questions or issues with the Document Management API:
1. Check the comprehensive documentation in `document_management_api.md`
2. Review the OpenAPI specification for technical details
3. Consult the existing codebase in `backend/app/routers/doc.py`
4. Contact the development team for additional support 