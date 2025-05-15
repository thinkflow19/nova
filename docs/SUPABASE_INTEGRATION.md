# Supabase Integration Documentation

## Overview
This document outlines best practices for integrating with Supabase in Python, highlighting common issues and their solutions. It is based on our experience with the cursor-python project.

## Key Components
Our application integrates with Supabase for:
1. **Database** - Storing project data
2. **Storage** - Managing file uploads and downloads
3. **Authentication** - User management (if used)

## Connection Methods

There are two main approaches to connecting with Supabase:

### 1. Supabase Client Library
```python
from supabase import create_client

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)
```

### 2. Direct REST API Calls
```python
import requests

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
rest_url = f"{supabase_url}/rest/v1"

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Example POST request
response = requests.post(
    f"{rest_url}/projects",
    headers=headers,
    json={"name": "Project Name"}
)
```

## Common Issues and Solutions

### 1. Schema Cache Issues
**Problem**: The Supabase client library sometimes fails with errors like "Column not found in schema cache" when trying to access tables.

**Solution**: Use direct REST API calls instead of the client library for database operations:

```python
# Instead of:
response = supabase.from_("projects").insert({"name": "Test"}).execute()

# Use:
response = requests.post(
    f"{rest_url}/projects",
    headers=headers,
    json={"name": "Test"}
)
```

### 2. Row Level Security (RLS) Issues
**Problem**: Queries return empty results even when data exists.

**Solution**:
- When using the anon key, ensure proper RLS policies are set up on your tables
- For admin operations, use the service_role_key (as we do in our tests)
- Check that your RLS policies match your access patterns

### 3. Storage Access Issues
**Problem**: Storage operations may fail with bucket-related errors.

**Solution**:
- Ensure the bucket exists before trying to use it
- Use proper error handling for storage operations
- Use the storage service wrapper for consistent access:

```python
from app.services.storage_service import StorageService

storage = StorageService()
result = storage.upload_document(file_content, file_name, content_type)
```

## Testing Integrations

We've implemented a comprehensive test suite in `backend/app/tests/integration_test_suite.py` that verifies:

1. Supabase Database connectivity
2. Supabase Storage operations
3. Pinecone vector database
4. OpenAI API (with fallback to mock implementations)

To run the tests:
```
python backend/app/tests/integration_test_suite.py
```

## Recommended Code Changes

For seamless integration, we recommend the following changes to the codebase:

1. **Database Access**: Use direct REST API calls for database operations to avoid schema cache issues:
   - Implement a consistent wrapper for database operations
   - Use the service_role_key for admin operations

2. **Error Handling**: Implement robust error handling for all Supabase operations:
   - Handle connection failures gracefully
   - Provide clear error messages
   - Implement retry mechanisms for transient failures

3. **Environment Configuration**:
   - Store all Supabase credentials in environment variables
   - Use a consistent approach to loading these variables
   - Document required environment variables

## Environment Variables

Ensure these environment variables are set:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key (for public access)
```

## References
- [Supabase Python Documentation](https://supabase.com/docs/reference/python/introduction)
- [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) 