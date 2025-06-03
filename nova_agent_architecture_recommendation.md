# Nova Backend: Agent + Tools Architecture Recommendation

## Current Architecture Issues

The current implementation uses both **Agents** and **Services**, which creates:

1. **Double Abstraction**: Agents calling services creates unnecessary layering
2. **Business Logic Scatter**: Both agents and services contain business rules  
3. **Tight Coupling**: Agents depend heavily on specific service implementations
4. **Complexity Without Benefit**: More code to maintain without clear architectural gains

## Recommended Architecture: Agent + Tools

### Core Principles

1. **Agents**: Contain business logic, decision-making, and workflow orchestration
2. **Tools**: Simple, stateless functions that do ONE thing well
3. **Clear Responsibilities**: Agents think, tools act
4. **Loose Coupling**: Tools are interchangeable, agents orchestrate

### Architecture Layers

```
┌─────────────────┐
│    Routers      │ ← API endpoints (minimal logic)
├─────────────────┤
│     Agents      │ ← Business logic, workflows, decisions
├─────────────────┤
│     Tools       │ ← Simple data/external operations
├─────────────────┤
│  Infrastructure │ ← Database, Storage, APIs
└─────────────────┘
```

### Implementation Example

#### 1. Tools (Replace Services)

```python
# app/tools/database_tools.py
class DatabaseTools:
    """Simple database operations - no business logic"""
    
    @staticmethod
    async def create_document(data: Dict[str, Any]) -> str:
        # Pure data insertion
        supabase = get_supabase_client()
        result = await supabase.table("documents").insert(data).execute()
        return result.data[0]["id"]
    
    @staticmethod
    async def get_document(document_id: str) -> Dict[str, Any]:
        # Pure data retrieval
        supabase = get_supabase_client()
        result = await supabase.table("documents").select("*").eq("id", document_id).execute()
        if not result.data:
            raise DocumentNotFoundError(document_id)
        return result.data[0]

# app/tools/storage_tools.py  
class StorageTools:
    """Simple storage operations - no business logic"""
    
    @staticmethod
    async def upload_file(content: bytes, bucket: str, path: str) -> str:
        # Pure file upload
        storage = get_storage_client()
        result = await storage.upload(bucket, path, content)
        return result.path
    
    @staticmethod
    async def generate_upload_url(bucket: str, path: str, expiry: int = 300) -> str:
        # Pure URL generation
        storage = get_storage_client()
        return await storage.create_signed_upload_url(bucket, path, expiry)

# app/tools/vector_tools.py
class VectorTools:
    """Simple vector operations - no business logic"""
    
    @staticmethod
    async def store_embeddings(embeddings: List[List[float]], metadata: List[Dict], namespace: str) -> int:
        # Pure vector storage
        pinecone = get_pinecone_client()
        vectors = [(f"chunk_{i}", emb, meta) for i, (emb, meta) in enumerate(zip(embeddings, metadata))]
        result = await pinecone.upsert(vectors, namespace=namespace)
        return result.upserted_count
```

#### 2. Agents (Replace Current Agent+Service Pattern)

```python
# app/agents/document_agent.py
class DocumentAgent:
    """Intelligent document management with business logic"""
    
    def __init__(self):
        # Agents orchestrate tools - no heavy dependencies
        self.db_tools = DatabaseTools()
        self.storage_tools = StorageTools()
        self.vector_tools = VectorTools()
        self.embedding_tools = EmbeddingTools()
    
    async def handle_upload_request(self, user_id: str, file_name: str, content_type: str, project_id: str) -> Dict[str, Any]:
        """Agent decides HOW to handle upload based on context"""
        
        # Business logic: Check permissions
        if not await self._user_can_upload_to_project(user_id, project_id):
            raise PermissionDeniedError("User cannot upload to this project")
        
        # Business logic: Validate file type
        if not self._is_supported_file_type(content_type):
            raise UnsupportedFileTypeError(f"File type {content_type} not supported")
        
        # Business logic: Generate storage strategy
        storage_path = self._generate_storage_path(project_id, file_name)
        bucket = self._select_storage_bucket(file_name, content_type)
        
        # Tool usage: Generate upload URL
        upload_url = await self.storage_tools.generate_upload_url(bucket, storage_path)
        
        return {
            "upload_url": upload_url,
            "storage_path": storage_path,
            "bucket": bucket
        }
    
    async def handle_upload_confirmation(self, user_id: str, file_name: str, storage_path: str, project_id: str) -> Dict[str, Any]:
        """Agent orchestrates post-upload workflow"""
        
        # Business logic: Create document record
        document_data = {
            "name": file_name,
            "project_id": project_id,
            "user_id": user_id,
            "storage_path": storage_path,
            "status": "uploaded"
        }
        
        # Tool usage: Store in database
        document_id = await self.db_tools.create_document(document_data)
        
        # Business logic: Decide processing strategy
        if self._should_auto_process(file_name, project_id):
            await self._schedule_processing(document_id)
        
        return {
            "document_id": document_id,
            "status": "confirmed",
            "will_auto_process": self._should_auto_process(file_name, project_id)
        }
    
    async def process_document(self, document_id: str) -> Dict[str, Any]:
        """Agent orchestrates complex document processing workflow"""
        
        # Tool usage: Get document
        document = await self.db_tools.get_document(document_id)
        
        # Business logic: Update status
        await self.db_tools.update_document(document_id, {"status": "processing"})
        
        try:
            # Tool usage: Download file
            file_content = await self.storage_tools.download_file(document["storage_bucket"], document["storage_path"])
            
            # Tool usage: Extract text
            text = await self.embedding_tools.extract_text(file_content, document["name"])
            
            # Tool usage: Create chunks
            chunks = await self.embedding_tools.chunk_text(text)
            
            # Tool usage: Generate embeddings
            embeddings = await self.embedding_tools.generate_embeddings(chunks)
            
            # Business logic: Create metadata
            metadata = self._create_chunk_metadata(document, chunks)
            
            # Tool usage: Store vectors
            namespace = f"proj_{document['project_id']}"
            stored_count = await self.vector_tools.store_embeddings(embeddings, metadata, namespace)
            
            # Business logic: Update document status
            await self.db_tools.update_document(document_id, {
                "status": "indexed", 
                "chunk_count": len(chunks),
                "pinecone_namespace": namespace
            })
            
            return {"status": "success", "chunks_processed": stored_count}
            
        except Exception as e:
            # Business logic: Handle errors
            await self.db_tools.update_document(document_id, {"status": "failed", "error": str(e)})
            raise DocumentProcessingError(f"Failed to process document: {e}")
    
    # Private methods contain business logic
    async def _user_can_upload_to_project(self, user_id: str, project_id: str) -> bool:
        project = await self.db_tools.get_project(project_id)
        return project["user_id"] == user_id or project.get("is_public", False)
    
    def _is_supported_file_type(self, content_type: str) -> bool:
        return content_type in ["application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    
    def _generate_storage_path(self, project_id: str, file_name: str) -> str:
        return f"{project_id}/{uuid.uuid4()}-{file_name}"
```

#### 3. Router Integration

```python
# app/routers/documents.py
@router.post("/upload")
async def request_upload(
    request: UploadRequest,
    current_user = Depends(get_current_user),
    doc_agent: DocumentAgent = Depends(get_document_agent)
):
    """Router delegates to agent immediately"""
    try:
        result = await doc_agent.handle_upload_request(
            user_id=current_user["id"],
            file_name=request.file_name,
            content_type=request.content_type,
            project_id=request.project_id
        )
        return UploadResponse(**result)
    except PermissionDeniedError as e:
        raise HTTPException(403, str(e))
    except UnsupportedFileTypeError as e:
        raise HTTPException(400, str(e))
```

### Benefits of This Architecture

1. **Clear Responsibilities**
   - Tools: Pure operations (database, storage, API calls)
   - Agents: Business logic, decision-making, workflow orchestration
   - Routers: HTTP handling and error translation

2. **Easy Testing**
   - Mock tools easily for unit testing agents
   - Test tools independently
   - Test business logic without external dependencies

3. **Reusability**
   - Tools can be used by multiple agents
   - Agents can call other agents for complex workflows
   - Clear interfaces between components

4. **Maintainability**
   - Single responsibility principle
   - Easy to add new tools or agents
   - Clear error boundaries

### Migration Strategy

1. **Phase 1**: Create tools to replace service methods
2. **Phase 2**: Refactor agents to use tools instead of services
3. **Phase 3**: Remove service layer
4. **Phase 4**: Add cross-agent communication for complex workflows

This architecture will make Nova more maintainable, testable, and truly "agentic" where agents can make intelligent decisions and orchestrate workflows effectively. 