from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, Form, File, Query
from typing import Dict, List, Optional, Any
import logging

from app.services.dependencies import get_current_user
from app.agents.document_agent import DocumentAgent
from app.models.documents import (
    UploadUrlRequest,
    UploadUrlResponse, 
    ConfirmUploadRequest,
    ConfirmUploadResponse,
    DocumentResponse,
    DeleteDocumentResponse,
    UploadCompleteResponse
)

# Configure logging
logger = logging.getLogger(__name__)

# Initialize the router with the /api/doc prefix
router = APIRouter(
    prefix="/api/doc",
    tags=["documents"],
)

# Dependency to get DocumentAgent instance
def get_document_agent() -> DocumentAgent:
    return DocumentAgent()

@router.post("/upload", response_model=UploadUrlResponse)
async def generate_upload_url(
    request: UploadUrlRequest,
    current_user=Depends(get_current_user),
    document_agent: DocumentAgent = Depends(get_document_agent)
):
    """Generate a presigned URL for uploading a document."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Generating upload URL for file: {request.file_name}, project: {request.project_id}")
        
        # Use DocumentAgent to generate upload URL
        result = await document_agent.generate_upload_url(
            file_name=request.file_name,
            content_type=request.content_type,
            project_id=request.project_id,
            user_id=user_id
        )
        
        logger.info(f"Router: Upload URL generated for {request.file_name}")
        return UploadUrlResponse(**result)
        
    except ValueError as ve:
        logger.warning(f"Router: Upload URL generation validation error: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error generating upload URL: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate upload URL: {str(e)}",
        )

@router.post("/confirm", response_model=ConfirmUploadResponse)
async def confirm_upload(
    request: ConfirmUploadRequest,
    current_user=Depends(get_current_user),
    document_agent: DocumentAgent = Depends(get_document_agent)
):
    """Confirm a document upload and schedule it for processing."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Confirming upload for file: {request.file_name}, project: {request.project_id}")
        
        # Use DocumentAgent to confirm upload
        result = await document_agent.confirm_upload(
            file_name=request.file_name,
            file_key=request.file_key,
            project_id=request.project_id,
            storage_bucket=request.bucket,
            content_type=request.content_type,
            user_id=user_id,
            file_size=request.file_size
        )
        
        logger.info(f"Router: Upload confirmed for document {result['document_id']}")
        return ConfirmUploadResponse(**result)
        
    except ValueError as ve:
        logger.warning(f"Router: Upload confirmation validation error: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error confirming upload: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm upload: {str(e)}",
        )

@router.get("/{project_id}/list", response_model=List[DocumentResponse])
async def list_documents(
    project_id: str,
    current_user=Depends(get_current_user),
    document_agent: DocumentAgent = Depends(get_document_agent),
    limit: int = Query(100, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List documents in a project."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Listing documents for project {project_id}, user {user_id}")
        
        # Use DocumentAgent to list documents
        documents = await document_agent.list_documents(
            project_id=project_id,
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        logger.info(f"Router: Found {len(documents)} documents for project {project_id}")
        return [DocumentResponse(**doc) for doc in documents]
        
    except ValueError as ve:
        logger.warning(f"Router: List documents validation error: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}",
        )

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user=Depends(get_current_user),
    document_agent: DocumentAgent = Depends(get_document_agent)
):
    """Get a specific document by ID."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Getting document {document_id} for user {user_id}")
        
        # Use DocumentAgent to get document
        document = await document_agent.get_document(document_id, user_id)
        
        logger.info(f"Router: Retrieved document {document_id}")
        return DocumentResponse(**document)
        
    except ValueError as ve:
        logger.warning(f"Router: Get document validation error: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error getting document: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document: {str(e)}",
        )

@router.delete("/{document_id}", response_model=DeleteDocumentResponse)
async def delete_document(
    document_id: str,
    current_user=Depends(get_current_user),
    document_agent: DocumentAgent = Depends(get_document_agent)
):
    """Delete a document and its associated storage."""
    try:
        user_id = current_user['id']
        logger.info(f"Router: Deleting document {document_id} for user {user_id}")
        
        # Use DocumentAgent to delete document
        result = await document_agent.delete_document(document_id, user_id)
        
        logger.info(f"Router: Document {document_id} deleted successfully")
        return DeleteDocumentResponse(**result)
        
    except ValueError as ve:
        logger.warning(f"Router: Delete document validation error: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error deleting document: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}",
        )

@router.post("/upload-complete", response_model=UploadCompleteResponse)
async def upload_file_complete(
    current_user=Depends(get_current_user),
    document_agent: DocumentAgent = Depends(get_document_agent),
    file: UploadFile = File(...),
    project_id: str = Form(...),
    file_name: str = Form(None),
):
    """Handle complete file upload (direct upload to backend)."""
    try:
        user_id = current_user['id']
        actual_file_name = file_name if file_name else file.filename
        logger.info(f"Router: Handling direct upload for file: {actual_file_name}, project: {project_id}")
        
        # Read file content
        file_content = await file.read()
        
        # Use DocumentAgent to handle complete upload
        result = await document_agent.upload_file_complete(
            file_content=file_content,
            file_name=actual_file_name,
            project_id=project_id,
            user_id=user_id,
            content_type=file.content_type or "application/octet-stream"
        )
        
        logger.info(f"Router: Direct upload completed for document {result['document_id']}")
        return UploadCompleteResponse(**result)
        
    except ValueError as ve:
        logger.warning(f"Router: Direct upload validation error: {ve}")
        if "access" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(ve))
        elif "not found" in str(ve).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.error(f"Router: Error in direct upload: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}",
        ) 