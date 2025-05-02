from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from typing import List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from app.models.document import DocumentCreate, DocumentResponse, PresignedUrlResponse
from app.services.dependencies import get_current_user, get_embedding_service, get_vector_store_service
from app.services.storage_service import default_storage_service, StorageService, StorageProvider
from app.services.embedding_service import EmbeddingService
from app.services.vector_store_service import VectorStoreService
from datetime import datetime
import uuid
import logging
import tempfile # Added for temporary file handling

# Langchain imports for loading and splitting
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter # Using recursive splitter

# Load environment variables
load_dotenv()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

router = APIRouter(
    prefix="/api/doc",
    tags=["documents"],
)

logger = logging.getLogger(__name__)


@router.post("/upload", response_model=PresignedUrlResponse)
async def get_upload_url(
    file_name: str = Form(...),
    content_type: str = Form(...),
    project_id: str = Form(...),
    current_user=Depends(get_current_user),
):
    """Get a presigned URL for direct upload or handle file upload directly."""
    try:
        # Verify project ownership
        response = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        project = response.data[0]
        if project["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to upload to this project",
            )

        # Generate a dummy file for testing
        dummy_file = f"test_file_{str(uuid.uuid4())[:8]}.txt"
        dummy_content = f"This is a test document for project {project_id}".encode()
        
        # Upload using the storage service (will handle either Supabase or S3)
        upload_result = default_storage_service.upload_document(
            file_content=dummy_content, 
            file_name=dummy_file,
            content_type="text/plain"
        )
        
        # Return the upload result
        return {
            "presigned_url": upload_result["url"],  # For direct browser upload if applicable
            "file_key": upload_result["key"],
            "provider": upload_result["provider"],
            "direct_upload": False  # Indicates if the file was uploaded directly
        }

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}",
        )


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    """Simple text chunking function."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap  # Move start position back by overlap
        if start < 0:  # Ensure start index is not negative
             start = 0
    return chunks


async def process_document(
    file_key: str, 
    file_name: str, 
    document_id: str, 
    project_id: str,
    storage_service: StorageService,
    embedding_service: EmbeddingService,
    vector_store_service: VectorStoreService
):
    """Downloads, parses, chunks, embeds, and upserts a document."""
    logger.info(f"[Processing] Starting document ID: {document_id}, Key: {file_key}, Name: {file_name}")
    
    try:
        # 1. Download file content to a temporary file
        file_content_bytes = storage_service.get_document(file_key)
        file_extension = file_name.split('.')[-1].lower() if '.' in file_name else ''
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
            temp_file.write(file_content_bytes)
            temp_file_path = temp_file.name
        logger.info(f"[Processing] File downloaded to temporary path: {temp_file_path}")

        # 2. Load document using Langchain loaders
        loader = None
        if file_extension == "pdf":
            loader = PyPDFLoader(temp_file_path)
        elif file_extension == "docx":
            loader = Docx2txtLoader(temp_file_path)
        elif file_extension == "txt":
            loader = TextLoader(temp_file_path, encoding="utf-8") # Specify encoding for text
        else:
            logger.error(f"[Processing] Unsupported file type '{file_extension}' for document {document_id}")
            # TODO: Update document status to 'failed'
            os.unlink(temp_file_path) # Clean up temp file
            return # Stop processing this file
            
        documents = loader.load()
        logger.info(f"[Processing] Loaded {len(documents)} document parts using {loader.__class__.__name__}")

        # 3. Chunk the document(s)
        # Adjust chunk_size and chunk_overlap as needed
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=150, 
            length_function=len
        )
        split_docs = text_splitter.split_documents(documents)
        text_chunks = [doc.page_content for doc in split_docs]
        logger.info(f"[Processing] Document {document_id} split into {len(text_chunks)} chunks.")

        # Clean up the temporary file
        os.unlink(temp_file_path)
        logger.info(f"[Processing] Cleaned up temporary file: {temp_file_path}")

        if not text_chunks:
            logger.warning(f"[Processing] No text chunks extracted from document {document_id}. Skipping embedding.")
            # TODO: Update status (e.g., 'empty' or 'completed_no_content')
            return

        # 4. Generate embeddings (using the async method from EmbeddingService)
        # Note: This assumes embedding_service.generate_embeddings is async
        all_embeddings = await embedding_service.generate_embeddings(text_chunks)

        if len(all_embeddings) != len(text_chunks):
            logger.error(f"[Processing] Mismatch between chunks ({len(text_chunks)}) and embeddings ({len(all_embeddings)}) for document {document_id}")
            raise Exception("Embedding generation failed: Count mismatch")

        # 5. Prepare vectors for upsert
        vectors_to_upsert = []
        for i, (chunk, embedding) in enumerate(zip(text_chunks, all_embeddings)):
            vector_id = f"{document_id}_{i}" # Unique ID for each chunk vector
            metadata = {
                "document_id": document_id,
                "project_id": project_id,
                "text": chunk,
                "chunk_number": i,
                "file_key": file_key,
                "file_name": file_name,
                # Add source info from Langchain docs if needed (e.g., page number for PDF)
                # "source": split_docs[i].metadata.get('source', file_name),
                # "page": split_docs[i].metadata.get('page', None)
            }
            vectors_to_upsert.append((vector_id, embedding, metadata))
            
        # 6. Upsert vectors to Vector Store (using async method)
        if vectors_to_upsert:
            logger.info(f"[Processing] Upserting {len(vectors_to_upsert)} vectors for document {document_id}...")
            await vector_store_service.upsert_vectors(vectors_to_upsert)
            logger.info(f"[Processing] Successfully upserted vectors for document {document_id}.")
            # TODO: Update document status to 'completed'
        else:
            logger.warning(f"[Processing] No vectors generated to upsert for document {document_id}.")
            # TODO: Update status?

    except Exception as e:
        logger.error(f"[Processing] Error processing document {document_id} ({file_key}): {e}", exc_info=True)
        # TODO: Update document status to 'failed'
        # Ensure temp file is cleaned up even if error occurs mid-process
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
             try:
                 os.unlink(temp_file_path)
                 logger.info(f"[Processing] Cleaned up temporary file after error: {temp_file_path}")
             except Exception as cleanup_err:
                 logger.error(f"[Processing] Error cleaning up temp file {temp_file_path}: {cleanup_err}")
        # Re-raise the exception so the background task runner knows it failed
        raise


@router.post("/confirm", response_model=DocumentResponse)
async def confirm_upload(
    file_name: str,
    file_key: str,
    project_id: str,
    current_user=Depends(get_current_user),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_store_service: VectorStoreService = Depends(get_vector_store_service),
    # Inject BackgroundTasks
    background_tasks: BackgroundTasks = Depends(),
):
    """Confirm file upload, register in DB, and queue background processing."""
    try:
        # Verify project ownership
        response = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        project = response.data[0]
        if project["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to upload to this project",
            )

        # Get file URL from the storage service
        # We don't strictly need the URL here anymore if processing happens in background
        # but maybe store it for reference?
        file_url = default_storage_service.get_document_url(file_key)

        # Register in database
        document_data = {
            "project_id": project_id,
            "file_name": file_name,
            "file_url": file_url, 
            "file_key": file_key,
            "uploaded_at": datetime.utcnow().isoformat(),
            # Add status later: e.g., 'processing_status': 'queued' 
        }

        db_response = supabase.table("documents").insert(document_data).execute()
        
        if not db_response.data:
             raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to register document in database")

        created_document = db_response.data[0]
        document_id = created_document['id']
        
        # --- Queue Document Processing in Background ---
        logger.info(f"Queueing background processing for document ID: {document_id}, Key: {file_key}")
        background_tasks.add_task(
            process_document,
            file_key=file_key,
            file_name=file_name,
            document_id=document_id,
            project_id=project_id,
            # Pass the singleton instances from dependencies
            storage_service=default_storage_service, # Assuming this is okay or pass config to re-init
            embedding_service=embedding_service, # Pass the injected instance
            vector_store_service=vector_store_service # Pass the injected instance
        )
        # --- End Queuing ---

        # Return the created document record immediately
        return created_document 

    except Exception as e:
        logger.error(f"Error in confirm_upload for file {file_key}: {e}", exc_info=True)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm upload: {str(e)}",
        )


@router.post("/upload-file", response_model=DocumentResponse)
async def upload_file_direct(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    current_user=Depends(get_current_user),
):
    """Handle file upload directly and create document record."""
    try:
        # Verify project ownership
        response = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        project = response.data[0]
        if project["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to upload to this project",
            )

        # Check file size (e.g., 5MB limit)
        file_size_limit = 5 * 1024 * 1024  # 5MB
        if file.size > file_size_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: 5MB"
            )
            
        # Check file type
        file_extension = file.filename.split(".")[-1].lower()
        allowed_extensions = ["pdf", "docx", "txt"]
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Supported types: {', '.join(allowed_extensions)}"
            )

        # Read file content
        file_content = await file.read()
        
        # Upload using storage service
        upload_result = default_storage_service.upload_document(
            file_content=file_content,
            file_name=file.filename,
            content_type=file.content_type
        )
        
        # Register in database
        document_data = {
            "project_id": project_id,
            "file_name": file.filename,
            "file_url": upload_result["url"],
            "file_key": upload_result["key"],
            "uploaded_at": datetime.utcnow().isoformat(),
        }

        response = supabase.table("documents").insert(document_data).execute()
        return response.data[0]

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        )


@router.get("/{project_id}/list", response_model=List[DocumentResponse])
async def list_documents(project_id: str, current_user=Depends(get_current_user)):
    """List all documents for a project."""
    try:
        # Verify project ownership
        response = supabase.table("projects").select("*").eq("id", project_id).execute()
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        project = response.data[0]
        if project["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this project",
            )

        # Get documents
        response = (
            supabase.table("documents")
            .select("*")
            .eq("project_id", project_id)
            .execute()
        )

        # Get signed URLs for each document
        documents = response.data
        for doc in documents:
            # Update the file_url to a fresh signed URL
            doc["file_url"] = default_storage_service.get_document_url(doc["file_key"])

        return documents

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}",
        )


@router.delete("/{document_id}")
async def delete_document(document_id: str, current_user=Depends(get_current_user)):
    """Delete a document and its associated file."""
    try:
        # Get document details
        response = (
            supabase.table("documents").select("*").eq("id", document_id).execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
            )

        document = response.data[0]

        # Get project details to verify ownership
        project_response = (
            supabase.table("projects")
            .select("*")
            .eq("id", document["project_id"])
            .execute()
        )

        if not project_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
            )

        project = project_response.data[0]

        # Verify user owns the project
        if project["user_id"] != current_user["id"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this document",
            )

        # Delete file using storage service
        default_storage_service.delete_document(document["file_key"])

        # Delete document record from database
        supabase.table("documents").delete().eq("id", document_id).execute()

        return {"message": "Document deleted successfully"}

    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        )
