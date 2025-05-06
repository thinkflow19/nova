from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from typing import Dict, List, Optional, Any
import logging
import uuid
from datetime import datetime
import asyncio
import json

# Import the document service and dependencies
from app.services.document_service import DocumentService, get_document_service
from app.services.dependencies import get_current_user
from app.services.storage_service import get_storage_service

# Configure logging
logger = logging.getLogger(__name__)

# Initialize the router with the /api/doc prefix
router = APIRouter(
    prefix="/api/doc",
    tags=["documents-legacy"],
)

# Initialize services
document_service = get_document_service()
storage_service = get_storage_service()

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
        presigned_url = storage_service.generate_presigned_upload_url(
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
            document = document_service.db_service.create_document(
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
        documents = document_service.db_service.list_documents(
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
        document = document_service.db_service.get_document(document_id)
        
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
        document_service.db_service.delete_document(document_id)
        
        return {"status": "success", "message": f"Document {document_id} deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        ) 