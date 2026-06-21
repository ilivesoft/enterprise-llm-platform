from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from db.session import get_db
from db.models import Model
from schemas.model import ModelOut, ModelListResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=ModelListResponse)
async def list_models(
    category: str | None = Query(None),
    provider: str | None = Query(None),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = select(Model)
    if category:
        q = q.where(Model.category == category)
    if provider:
        q = q.where(Model.provider == provider)
    if search:
        q = q.where(Model.name.ilike(f"%{search}%"))

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar_one()

    q = q.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(q)
    items = result.scalars().all()

    return ModelListResponse(items=items, total=total, page=page, per_page=per_page)


@router.get("/{model_id}", response_model=ModelOut)
async def get_model(model_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Model).where(Model.id == model_id))
    model = result.scalar_one_or_none()
    if not model:
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다.")
    return model
