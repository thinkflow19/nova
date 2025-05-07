from fastapi import APIRouter, Depends, HTTPException, status, Request, Body, UploadFile, Form, File
from typing import Dict, List, Optional, Any
import logging
import uuid
from datetime import datetime, timedelta
import asyncio
import json
import time

# Import the document service and dependencies
from app.services.document_service import DocumentService, get_document_service
from app.services.dependencies import get_current_user
from app.services.storage_service import get_storage_service

# Configure logging
logger = logging.getLogger(__name__)

# Initialize the router with the /api/doc prefix
router = APIRouter(
    prefix="/api/doc",
    tags=["documents"],
)

# Initialize services
document_service = get_document_service()
storage_service = get_storage_service()

# Document status cache with TTL (Time To Live)
# Structure: {document_id: {"data": document_data, "timestamp": time_added}}
document_cache = {}
CACHE_TTL_SECONDS = 3  # Short TTL for documents in processing state, longer for completed

def get_cached_document(document_id: str) -> Optional[Dict[str, Any]]:
    """Get document from cache if it exists and is not expired"""
    if document_id in document_cache:
        cache_entry = document_cache[document_id]
        current_time = time.time()
        
        # Check if cache entry is expired
        if current_time - cache_entry["timestamp"] < CACHE_TTL_SECONDS:
            # If document is completed or failed, use a longer TTL
            document_status = cache_entry["data"].get("status")
            if document_status in ["completed", "failed"]:
                if current_time - cache_entry["timestamp"] < 30:  # 30 seconds for completed/failed
                    return cache_entry["data"]
            else:
                return cache_entry["data"]
    
    return None

def add_document_to_cache(document_id: str, document_data: Dict[str, Any]) -> None:
    """Add document to cache with current timestamp"""
    document_cache[document_id] = {
        "data": document_data,
        "timestamp": time.time()
    }
    
    # Clean up old cache entries occasionally
    if len(document_cache) > 100 or (len(document_cache) > 0 and time.time() % 60 < 1):
        clean_document_cache()

def clean_document_cache() -> None:
    """Remove expired entries from the document cache"""
    current_time = time.time()
    expired_keys = []
    
    for doc_id, cache_entry in document_cache.items():
        # Use a longer TTL for completed or failed documents
        document_status = cache_entry["data"].get("status")
        if document_status in ["completed", "failed"]:
            if current_time - cache_entry["timestamp"] > 60:  # 1 minute for completed/failed
                expired_keys.append(doc_id)
        else:
            if current_time - cache_entry["timestamp"] > CACHE_TTL_SECONDS:
                expired_keys.append(doc_id)
    
    for key in expired_keys:
        document_cache.pop(key, None)
    
    if expired_keys:
        logger.debug(f"Cleaned {len(expired_keys)} expired document cache entries")

@router.post("/upload")
async def generate_upload_url(request: Request, current_user=Depends(get_current_user)):
    """Generate a presigned URL for uploading a document (legacy endpoint)."""
    try:
        # Get content type to determine parsing method
        content_type = request.headers.get("content-type", "")
        logger.info(f"Request content type: {content_type}")
        
        # Variables to store our required fields
        file_name = None
        file_content_type = None
        project_id = None
        
        # Different parsing based on content type
        if "multipart/form-data" in content_type:
            # Parse as form data
            form_data = await request.form()
            logger.info(f"Received form data: {dict(form_data)}")
            
            file_name = form_data.get("file_name")
            file_content_type = form_data.get("content_type")
            project_id = form_data.get("project_id")
        else:
            # Parse as JSON
            try:
                json_data = await request.json()
                logger.info(f"Received JSON data: {json_data}")
                
                file_name = json_data.get("file_name")
                file_content_type = json_data.get("content_type")
                project_id = json_data.get("project_id")
            except Exception as e:
                logger.error(f"Failed to parse request body as JSON: {str(e)}")
                
                # Fallback: try to read raw body
                body = await request.body()
                logger.info(f"Raw request body: {body}")
                
                # Try to detect and extract form data manually if needed
                if body and b'name="file_name"' in body:
                    logger.info("Attempting to manually parse multipart form data")
                    # This is a very basic manual parsing - a real implementation would be more robust
                    try:
                        decoded = body.decode('utf-8')
                        if 'name="file_name"' in decoded:
                            file_name_parts = decoded.split('name="file_name"')
                            if len(file_name_parts) > 1:
                                file_name = file_name_parts[1].split('\r\n\r\n')[1].split('\r\n')[0]
                        
                        if 'name="content_type"' in decoded:
                            content_type_parts = decoded.split('name="content_type"')
                            if len(content_type_parts) > 1:
                                file_content_type = content_type_parts[1].split('\r\n\r\n')[1].split('\r\n')[0]
                        
                        if 'name="project_id"' in decoded:
                            project_id_parts = decoded.split('name="project_id"')
                            if len(project_id_parts) > 1:
                                project_id = project_id_parts[1].split('\r\n\r\n')[1].split('\r\n')[0]
                    except Exception as parse_err:
                        logger.error(f"Failed manual form parsing: {str(parse_err)}")
        
        logger.info(f"Parsed values - file_name: {file_name}, content_type: {file_content_type}, project_id: {project_id}")
        
        # Check if we have all required fields
        missing_fields = []
        if not file_name:
            missing_fields.append("file_name")
        if not file_content_type:
            missing_fields.append("content_type")
        if not project_id:
            missing_fields.append("project_id")
            
        if missing_fields:
            logger.error(f"Missing required fields: {', '.join(missing_fields)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields: {', '.join(missing_fields)}",
            )
        
        logger.info(f"Processing upload URL generation for file: {file_name}, project: {project_id}")
        
        # Validate file type
        file_extension = file_name.split(".")[-1].lower() if "." in file_name else ""
        allowed_extensions = ["pdf", "docx", "txt", "md", "csv", "json"]
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_extension}. Supported types: {', '.join(allowed_extensions)}"
            )
        
        # Generate storage path
        storage_bucket = "documents"
        storage_path = f"{project_id}/{uuid.uuid4()}-{file_name}"
        
        # Generate presigned URL
        presigned_url = await storage_service.generate_presigned_upload_url(
            storage_bucket=storage_bucket,
            storage_path=storage_path,
            content_type=file_content_type,
            expiry=300  # 5 minutes
        )
        
        # Return response with file_key and bucket explicitly added
        response = {}
        if isinstance(presigned_url, dict):
            # If response is already a dictionary, copy all fields
            response = presigned_url.copy()
        else:
            # For backward compatibility with string URLs
            response["presigned_url"] = presigned_url
            
        # Ensure these fields are always present
        response["file_key"] = storage_path
        response["bucket"] = storage_bucket
        
        # Add document_id field which is the same as file_key for simplicity
        # This is expected by the frontend
        response["document_id"] = storage_path
        
        # Log the final response 
        logger.info(f"Upload response payload: {response}")
        
        return response
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error generating presigned URL: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate presigned URL: {str(e)}",
        )

@router.post("/confirm")
async def confirm_upload(request: Request, current_user=Depends(get_current_user)):
    """Confirm a document upload and start processing."""
    try:
        # Get content type
        content_type = request.headers.get("content-type", "")
        logger.info(f"Confirm endpoint - Request content type: {content_type}")
        
        # Parse request data
        try:
            if "application/json" in content_type:
                # Parse as JSON
                json_body = await request.json()
                logger.info(f"Received JSON confirmation data: {json_body}")
                
                file_name = json_body.get("file_name")
                file_key = json_body.get("file_key")
                project_id = json_body.get("project_id")
            else:
                # Try to parse as form data or other format
                try:
                    # First try as form data
                    form_data = await request.form()
                    file_name = form_data.get("file_name")
                    file_key = form_data.get("file_key")
                    project_id = form_data.get("project_id")
                except Exception:
                    # Fall back to raw body parsing
                    try:
                        raw_body = await request.body()
                        logger.info(f"Raw confirm request body: {raw_body}")
                        
                        # Try to decode as JSON
                        try:
                            body_text = raw_body.decode('utf-8')
                            if body_text.strip().startswith("{"):
                                import json
                                json_data = json.loads(body_text)
                                file_name = json_data.get("file_name")
                                file_key = json_data.get("file_key")
                                project_id = json_data.get("project_id")
                        except Exception as decode_err:
                            logger.error(f"Failed to decode raw body: {str(decode_err)}")
                    except Exception as e:
                        logger.error(f"Failed to parse confirmation request: {str(e)}")
        except Exception as parse_error:
            logger.error(f"Error parsing confirm request data: {str(parse_error)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error parsing request data: {str(parse_error)}",
            )
        
        logger.info(f"Confirm parsed values - file_name: {file_name}, file_key: {file_key}, project_id: {project_id}")
        
        # Validate required fields
        if not all([file_name, file_key, project_id]):
            missing_fields = []
            if not file_name:
                missing_fields.append("file_name")
            if not file_key:
                missing_fields.append("file_key")
            if not project_id:
                missing_fields.append("project_id")
                
            logger.error(f"Missing required confirmation fields: {', '.join(missing_fields)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields: {', '.join(missing_fields)}",
            )
        
        logger.info(f"Confirming document upload: {file_name} for project {project_id}")
        
        # Get file extension
        file_extension = file_name.split(".")[-1].lower() if "." in file_name else ""
        
        try:
            # Create document record in database
            document = await document_service.db_service.create_document(
                name=file_name,
                description=None,
                project_id=project_id,
                user_id=current_user["id"],
                storage_path=file_key,
                storage_bucket="documents",
                file_type=file_extension,
                file_size=0,  # Will be updated during processing
                metadata={
                    "original_filename": file_name,
                    "upload_timestamp": datetime.utcnow().isoformat(),
                },
            )
            
            logger.info(f"Created document record in database: {document['id']}")
            logger.info(f"Document details: storage_path={file_key}, bucket=documents, file_type={file_extension}")
            
            # Queue document for processing
            asyncio.create_task(document_service.queue_document_processing(document["id"]))
            
            logger.info(f"Document confirmed and queued for processing: {document['id']}")
            return document
        except Exception as db_error:
            logger.error(f"Database error creating document record: {str(db_error)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create document record: {str(db_error)}",
            )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error confirming document upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm document upload: {str(e)}",
        )

@router.get("/{project_id}/list")
async def list_documents(project_id: str, current_user=Depends(get_current_user)):
    """List all documents in a project."""
    try:
        logger.info(f"Listing documents for project ID: {project_id}")
        
        # Query documents from database
        documents = await document_service.db_service.list_documents(
            project_id=project_id, limit=100, offset=0
        )
        
        logger.info(f"Found {len(documents)} documents for project")
        return documents
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}",
        )

@router.delete("/{document_id}")
async def delete_document(document_id: str, current_user=Depends(get_current_user)):
    """Delete a document."""
    try:
        logger.info(f"Deleting document with ID: {document_id}")
        
        # Get the document to check ownership
        document = await document_service.db_service.get_document(document_id)
        
        # Delete document from storage
        try:
            await document_service.delete_document_from_storage(
                bucket=document["storage_bucket"],
                path=document["storage_path"],
            )
        except Exception as e:
            logger.error(f"Failed to delete document from storage: {str(e)}")
            # Continue with database deletion
        
        # Delete document from database
        await document_service.db_service.delete_document(document_id)
        
        return {"status": "success", "message": f"Document {document_id} deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        )

@router.post("/upload-complete")
async def upload_file_complete(
    request: Request,
    current_user=Depends(get_current_user),
    file: UploadFile = File(...),
    project_id: str = Form(...),
    file_name: str = Form(None),
):
    """
    Complete file upload flow that processes files directly through the backend.
    
    This endpoint:
    1. Receives the file directly from the client
    2. Validates the file
    3. Uploads it to storage
    4. Creates a document record
    5. Queues processing
    6. Returns the document details
    """
    try:
        # Log upload request details
        logger.info(f"Handling direct file upload: '{file.filename}' ({file.content_type}) for project {project_id}")
        
        # Use provided file_name or fall back to the uploaded filename
        name = file_name or file.filename
        
        # Check file extension
        file_extension = name.split(".")[-1].lower() if "." in name else ""
        allowed_extensions = ["pdf", "docx", "txt", "md", "csv", "json"]
        
        if file_extension not in allowed_extensions:
            logger.warning(f"Rejected file with unsupported extension: {file_extension}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {file_extension}. Supported types: {', '.join(allowed_extensions)}"
            )
        
        # Check content type for consistency
        expected_content_types = {
            "pdf": ["application/pdf"],
            "docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
            "txt": ["text/plain"],
            "md": ["text/markdown", "text/plain"],
            "csv": ["text/csv", "text/plain"],
            "json": ["application/json", "text/plain"]
        }
        
        if file.content_type and file_extension in expected_content_types:
            if file.content_type not in expected_content_types[file_extension]:
                logger.warning(f"Content type mismatch: File has extension '{file_extension}' but content type '{file.content_type}'")
                # Don't reject, just log warning
        
        # Check file size before reading fully into memory
        # Read in chunks to calculate size and avoid loading large files entirely into memory
        file_size = 0
        chunk_size = 1024 * 1024  # 1MB chunks
        max_file_size = 50 * 1024 * 1024  # 50MB max
        
        # Reset file pointer
        await file.seek(0)
        
        # Read file in chunks to calculate size
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            file_size += len(chunk)
            if file_size > max_file_size:
                logger.warning(f"Rejected file exceeding size limit: {file_size} bytes")
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File too large. Maximum size: {max_file_size / (1024 * 1024)}MB"
                )
        
        # Reset file pointer for processing
        await file.seek(0)
        
        # Log file details before processing
        logger.info(f"Processing valid file: {name}, Size: {file_size / 1024:.1f}KB, Type: {file.content_type}")
        
        # Process the document upload using the document service
        try:
            document = await document_service.process_document_upload(
                file=file,
                project_id=project_id,
                user_id=current_user["id"],
                name=name,
                description=f"Uploaded on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
            )
            
            logger.info(f"Document successfully uploaded and queued for processing: {document['id']}")
            
            # Return the document record with additional info for frontend
            return {
                **document,
                "message": "Document uploaded successfully and queued for processing."
            }
        except Exception as process_err:
            logger.error(f"Error processing document upload: {str(process_err)}", exc_info=True)
            # Categorize the error for better frontend handling
            if "size" in str(process_err).lower():
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=str(process_err)
                )
            elif "type" in str(process_err).lower() or "extension" in str(process_err).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(process_err)
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error processing document: {str(process_err)}"
                )
        
    except HTTPException:
        # Re-raise HTTP exceptions directly
        raise
    except Exception as e:
        logger.error(f"Unexpected error handling direct file upload: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file upload: {str(e)}"
        )

@router.get("/{document_id}")
async def get_document(
    document_id: str,
    current_user=Depends(get_current_user),
):
    """
    Get a document by ID.
    
    This endpoint returns the document details, including processing status.
    Cache is used to reduce database load from frequent polling.
    """
    try:
        # Check if we have a cached version
        cached_document = get_cached_document(document_id)
        if cached_document:
            # Verify user access even for cached documents
            user_id = current_user["id"]
            project_id = cached_document.get("project_id")
            
            # Quick check for owner
            if cached_document.get("user_id") == user_id:
                return cached_document
                
            # For non-owners, we'll skip the cache and go through normal checks
            # This avoids caching the authorization logic which can be complex
        
        # Get the document from the database
        document = await document_service.db_service.get_document(document_id)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
            
        # Check if user has access to this document
        user_id = current_user["id"]
        project_id = document.get("project_id")
        
        # If user is not document owner, check if they have access to the project
        if document.get("user_id") != user_id:
            # Use the custom auth util to check if user has access to project
            try:
                # Check project membership
                project = await document_service.db_service.get_project(project_id)
                
                # If the project is public, allow access
                if project.get("is_public"):
                    pass
                # Check if user is the project owner
                elif project.get("user_id") == user_id:
                    pass
                # Otherwise, check for shared access
                else:
                    shared_access = await document_service.db_service.execute_custom_query(
                        table="shared_objects",
                        query_params={
                            "select": "*",
                            "filters": {
                                "object_type": "eq.project",
                                "object_id": f"eq.{project_id}",
                                "shared_with": f"eq.{user_id}",
                            },
                        },
                    )

                    if not shared_access:
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="You do not have access to this document"
                        )
            except Exception as e:
                logger.error(f"Error checking project access: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this document"
                )
        
        # Add document to cache before returning
        add_document_to_cache(document_id, document)
                
        # Return document details with processing status
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving document: {str(e)}"
        ) 