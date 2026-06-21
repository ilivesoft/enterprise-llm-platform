import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.session import get_db
from db.models import Conversation
from schemas.conversation import ConversationCreate, ConversationOut

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _assign_group(created_at: datetime) -> str:
    """대화 기간 그룹 결정."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)
    last7_start = today_start - timedelta(days=7)
    last30_start = today_start - timedelta(days=30)

    if created_at >= today_start:
        return "today"
    elif created_at >= yesterday_start:
        return "yesterday"
    elif created_at >= last7_start:
        return "last7"
    elif created_at >= last30_start:
        return "last30"
    else:
        return "older"


@router.get("", response_model=list[ConversationOut])
async def list_conversations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()

    out = []
    for conv in conversations:
        data = ConversationOut.model_validate(conv)
        data.group = _assign_group(conv.created_at)
        out.append(data)
    return out


@router.post("", response_model=ConversationOut, status_code=201)
async def create_conversation(
    payload: ConversationCreate, db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    title = payload.title or "새 대화"
    conv = Conversation(
        id=str(uuid.uuid4()),
        title=title,
        title_en=title,
        service_id=payload.service_id,
        created_at=now,
        updated_at=now,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    data = ConversationOut.model_validate(conv)
    data.group = _assign_group(conv.created_at)
    return data


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.")
    data = ConversationOut.model_validate(conv)
    data.group = _assign_group(conv.created_at)
    return data
