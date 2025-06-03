from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UploadUrlRequest(BaseModel):
    """Request model for generating document upload URL."""
    file_name: str = Field(..., min_length=1, description="Name of the file to upload")
    content_type: str = Field(..., description="MIME type of the file")
    project_id: str = Field(..., description="ID of the project to upload the document to")

class UploadUrlResponse(BaseModel):
    """Response model for upload URL generation."""
    presigned_url: str = Field(..., description="Presigned URL for uploading the file")
    file_key: str = Field(..., description="Storage key/path for the file")
    bucket: str = Field(..., description="Storage bucket name")
    document_id: str = Field(..., description="Document identifier")

class ConfirmUploadRequest(BaseModel):
    """Request model for confirming document upload."""
    file_name: str = Field(..., min_length=1, description="Name of the uploaded file")
    file_key: str = Field(..., description="Storage key/path of the uploaded file")
    project_id: str = Field(..., description="ID of the project")
    bucket: str = Field(..., description="Storage bucket name")
    content_type: str = Field(..., description="MIME type of the file")
    file_size: Optional[int] = Field(None, ge=0, description="Size of the file in bytes")

class ConfirmUploadResponse(BaseModel):
    """Response model for upload confirmation."""
    document_id: str = Field(..., description="ID of the created document")
    status: str = Field(..., description="Status of the upload confirmation")
    message: str = Field(..., description="Confirmation message")

class DocumentResponse(BaseModel):
    """Response model for document information."""
    id: str = Field(..., description="Document ID")
    project_id: str = Field(..., description="Project ID")
    user_id: str = Field(..., description="User ID who uploaded the document")
    name: str = Field(..., description="Name of the document")
    description: Optional[str] = Field(None, description="Description of the document")
    storage_path: str = Field(..., description="Storage path of the document")
    storage_bucket: str = Field(..., description="Storage bucket name")
    file_type: Optional[str] = Field(None, description="MIME type of the file")
    file_size: Optional[int] = Field(None, description="Size of the file in bytes")
    status: str = Field(..., description="Processing status of the document")
    processing_error: Optional[str] = Field(None, description="Error message if processing failed")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")
    pinecone_namespace: Optional[str] = Field(None, description="Pinecone namespace for the document")
    chunk_count: Optional[int] = Field(None, description="Number of chunks the document was split into")
    created_at: datetime = Field(..., description="Timestamp when the document was created")
    updated_at: datetime = Field(..., description="Timestamp when the document was last updated")

class DeleteDocumentResponse(BaseModel):
    """Response model for document deletion."""
    document_id: str = Field(..., description="ID of the deleted document")
    status: str = Field(..., description="Status of the deletion")
    message: str = Field(..., description="Deletion confirmation message")

class UploadCompleteResponse(BaseModel):
    """Response model for direct file upload completion."""
    document_id: str = Field(..., description="ID of the uploaded document")
    status: str = Field(..., description="Status of the upload")
    message: str = Field(..., description="Upload completion message")
    storage_path: str = Field(..., description="Storage path where the file was saved") 