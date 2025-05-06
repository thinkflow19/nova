from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class ChatSessionBase(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    is_pinned: bool = False
    ai_config: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ChatSessionCreate(ChatSessionBase):
    project_id: uuid.UUID


class ChatSessionUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    is_pinned: Optional[bool] = None
    ai_config: Optional[Dict[str, Any]] = None


class ChatSession(ChatSessionBase):
    id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(ChatSessionBase):
    id: str
    project_id: str
    user_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    role: str  # 'user', 'assistant', 'system'
    content: str
    tokens: Optional[int] = None
    is_indexed: bool = False
    is_pinned: bool = False
    reactions: Optional[Dict[str, Any]] = Field(default_factory=dict)
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ChatMessageCreate(ChatMessageBase):
    session_id: uuid.UUID
    project_id: uuid.UUID


class ChatMessageUpdate(BaseModel):
    content: Optional[str] = None
    is_indexed: Optional[bool] = None
    is_pinned: Optional[bool] = None
    reactions: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class ChatMessage(ChatMessageBase):
    id: uuid.UUID
    session_id: uuid.UUID
    project_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageResponse(ChatMessageBase):
    id: str
    session_id: str
    project_id: str
    user_id: str
    created_at: str

    class Config:
        from_attributes = True


class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessageBase]
    session_id: str
    project_id: str
    stream: bool = False
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
