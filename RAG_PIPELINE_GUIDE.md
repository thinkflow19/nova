# Nova RAG Pipeline Implementation Guide

This document provides a comprehensive guide to setting up, customizing, and troubleshooting the Retrieval-Augmented Generation (RAG) pipeline in Nova.

## Overview

The RAG pipeline in Nova consists of several key components:

1. **Document Upload**: Users upload documents through the frontend interface
2. **Document Processing**: Files are stored, text is extracted, and the content is chunked
3. **Vector Embedding**: Text chunks are converted to vector embeddings
4. **Vector Storage**: Embeddings are stored in a vector database (Pinecone)
5. **Retrieval**: When users ask questions, relevant document chunks are retrieved
6. **Response Generation**: Retrieved context is combined with user queries to generate responses

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
SUPABASE_DEFAULT_BUCKET=documents

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_CHAT_MODEL=gpt-4-turbo
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1024

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=proj

# Server Configuration
PORT=8000
HOST=0.0.0.0
FRONTEND_URL=http://localhost:3000
STREAMING_ENABLED=true

# Document Processing Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
MAX_DOCUMENT_SIZE_MB=10
VECTOR_SEARCH_TOP_K=5
```

### Frontend Environment Variables

Create a `.env.local` file in the frontend directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Setup Instructions

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Initialize the database using the schema in `backend/scripts/archive/supabase_schema.sql`
3. Create a storage bucket named `documents` in Supabase

### Vector Database Setup

1. Create a Pinecone account at [pinecone.io](https://pinecone.io)
2. Create an index named `proj` with dimension 1024 (for text-embedding-3-small)
3. Copy your API key and environment from the Pinecone console

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## Testing the RAG Pipeline

### Document Upload

1. Create a project/bot in the UI
2. Upload a test document (PDF, DOCX, TXT, etc.)
3. Wait for processing to complete

### Query the Bot

1. Navigate to the chat interface
2. Ask questions related to the uploaded document content
3. Verify that relevant content is retrieved and used in responses

## Customization Options

### Vector Embedding

You can customize the embedding model and dimensions:

```python
# In .env
EMBEDDING_MODEL=text-embedding-3-small  # or text-embedding-3-large, etc.
EMBEDDING_DIMENSION=1024                # Must match model's output dimension
```

### Text Chunking

Adjust text chunking parameters according to your needs:

```python
# In .env
CHUNK_SIZE=1000     # Size of each text chunk
CHUNK_OVERLAP=200   # Overlap between consecutive chunks
```

### Vector Retrieval

Modify vector search parameters:

```python
# In .env
VECTOR_SEARCH_TOP_K=5  # Number of chunks to retrieve
```

## Troubleshooting

### Document Processing Issues

If documents fail to process:

1. Check the backend logs for specific errors
2. Verify Supabase storage permissions
3. Ensure document formats are supported
4. Check file size limits (default 10MB)

### Vector Search Issues

If context retrieval is not working:

1. Verify Pinecone index exists and has correct dimensions
2. Check if embeddings were successfully stored (look for processing status)
3. Try a more specific query
4. Review logs for API errors

### OpenAI API Issues

If you encounter OpenAI API errors:

1. Verify your API key is valid
2. Check usage limits and billing
3. Ensure the specified models are available for your account
4. Review rate limiting settings

## Performance Optimization

### Database Indexing

Ensure proper indexes are created on frequently queried fields:

```sql
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_project_id ON chat_sessions(project_id);
```

### Caching

Implement caching for frequently accessed data:

1. Consider using Redis for session and document metadata caching
2. Cache embedding results for similar queries

### Rate Limiting

Protect external API calls with rate limiting:

```python
# In .env
OPENAI_RATE_LIMIT_RPM=60
PINECONE_RATE_LIMIT_RPM=100
```

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Authentication**: Ensure all endpoints require authentication
3. **Input Validation**: Validate all user inputs to prevent injection attacks
4. **Data Isolation**: Ensure projects and documents are properly isolated between users

## Advanced Configuration

### Custom Vector Store

To use a different vector database (e.g., Weaviate, Milvus):

1. Create a new implementation of the `VectorStoreInterface`
2. Update the factory function in `vector_store_service.py`
3. Update environment variables accordingly

### Custom Embedding Models

To use a different embedding provider:

1. Create a new implementation of the `EmbeddingInterface`
2. Update the factory function in `embedding_service.py`
3. Update environment variables accordingly

## Monitoring and Logging

Enable comprehensive logging for debugging:

```python
# In .env
LOG_LEVEL=DEBUG  # Options: DEBUG, INFO, WARNING, ERROR
```

Monitor key metrics:
- Document processing time
- Embedding generation latency
- Vector search performance
- Response generation time

## Future Improvements

Consider these enhancements to the pipeline:

1. **Hybrid Search**: Combine vector search with keyword search for better results
2. **Feedback Loop**: Collect user feedback on response quality
3. **Streaming Progress**: Implement streaming updates for document processing status
4. **Advanced Chunking**: Use semantic chunking instead of size-based chunking
5. **Multi-model Support**: Allow switching between different LLM providers 