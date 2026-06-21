import uuid
import hashlib
import secrets
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from db.session import get_db
from db.models import ApiKey

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


class ApiKeyOut(BaseModel):
    id: str
    name: str
    key_masked: str
    last_used_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiKeyCreateResponse(ApiKeyOut):
    """생성 시에만 원본 키 반환."""
    raw_key: str


class ApiKeyCreate(BaseModel):
    name: str


def _mask_key(key_hash: str) -> str:
    """키 해시로부터 마스킹된 키 표현 생성."""
    return f"llm-{key_hash[:8]}...{key_hash[-4:]}"


@router.get("", response_model=list[ApiKeyOut])
async def list_api_keys(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ApiKey).order_by(ApiKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [
        ApiKeyOut(
            id=k.id,
            name=k.name,
            key_masked=_mask_key(k.key_hash),
            last_used_at=k.last_used_at,
            created_at=k.created_at,
        )
        for k in keys
    ]


@router.post("", response_model=ApiKeyCreateResponse, status_code=201)
async def create_api_key(payload: ApiKeyCreate, db: AsyncSession = Depends(get_db)):
    raw_key = f"llm-{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    api_key = ApiKey(
        id=str(uuid.uuid4()),
        name=payload.name,
        key_hash=key_hash,
        created_at=datetime.utcnow(),
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return ApiKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        key_masked=_mask_key(key_hash),
        raw_key=raw_key,
        last_used_at=api_key.last_used_at,
        created_at=api_key.created_at,
    )


@router.delete("/{key_id}", status_code=204)
async def delete_api_key(key_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API 키를 찾을 수 없습니다.")
    await db.delete(key)
    await db.commit()
