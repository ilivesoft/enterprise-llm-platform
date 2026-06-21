from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ServiceOut(BaseModel):
    id: str
    name: str
    name_en: str
    model_id: str
    provider: str
    rag_enabled: bool
    status: str
    favorite: bool
    requests_30d: str
    avg_latency: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ServiceCreate(BaseModel):
    name: str
    name_en: str
    model_id: str
    provider: str
    rag_enabled: bool = False
    status: str = "stopped"
    favorite: bool = False
    requests_30d: str = "0"
    avg_latency: str = "—"


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    model_id: Optional[str] = None
    provider: Optional[str] = None
    rag_enabled: Optional[bool] = None
    status: Optional[str] = None
    favorite: Optional[bool] = None
    requests_30d: Optional[str] = None
    avg_latency: Optional[str] = None
