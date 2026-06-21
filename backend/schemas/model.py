from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ModelOut(BaseModel):
    id: str
    name: str
    provider: str
    version: str
    params: str
    category: str
    context_window: str
    tags: Optional[list[str]] = None
    featured: bool
    updated_at: datetime

    model_config = {"from_attributes": True}


class ModelListResponse(BaseModel):
    items: list[ModelOut]
    total: int
    page: int
    per_page: int
