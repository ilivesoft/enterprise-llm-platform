from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: Optional[str] = None
    service_id: Optional[str] = None


class ConversationOut(BaseModel):
    id: str
    title: str
    title_en: str
    service_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    group: Optional[str] = None

    model_config = {"from_attributes": True}


class MessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    model_id: Optional[str] = None
    citations: Optional[list[str]] = None
    token_count: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str
    model_id: str
