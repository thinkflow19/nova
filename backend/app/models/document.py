from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class DocumentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    storage_path: str
    storage_bucket: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    status: str = "processing"  # 'processing', 'indexed', 'failed'
    processing_error: Optional[str] = None
    pinecone_namespace: Optional[str] = None
    chunk_count: int = 0
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class DocumentCreate(DocumentBase):
    project_id: uuid.UUID


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    processing_error: Optional[str] = None
    chunk_count: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class Document(DocumentBase):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(DocumentBase):
    id: str
    project_id: str
    user_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class PresignedUrlResponse(BaseModel):
    presigned_url: str
    file_key: str
