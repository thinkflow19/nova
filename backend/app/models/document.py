from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from datetime import datetime


class DocumentBase(BaseModel):
    file_name: str


class DocumentCreate(DocumentBase):
    project_id: str


class Document(DocumentBase):
    id: str
    project_id: str
    file_url: HttpUrl
    embedding_id: Optional[str] = None
    uploaded_at: datetime


class DocumentResponse(Document):
    pass


class PresignedUrlResponse(BaseModel):
    presigned_url: str
    file_key: str
