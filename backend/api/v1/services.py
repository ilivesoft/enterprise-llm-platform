import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.session import get_db
from db.models import Service
from schemas.service import ServiceOut, ServiceCreate, ServiceUpdate

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[ServiceOut])
async def list_services(
    status: str | None = Query(None),
    search: str | None = Query(None),
    favorite: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Service)
    if status:
        q = q.where(Service.status == status)
    if search:
        q = q.where(
            Service.name.ilike(f"%{search}%") | Service.name_en.ilike(f"%{search}%")
        )
    if favorite is not None:
        q = q.where(Service.favorite == favorite)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ServiceOut, status_code=201)
async def create_service(payload: ServiceCreate, db: AsyncSession = Depends(get_db)):
    service = Service(id=str(uuid.uuid4()), **payload.model_dump())
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


@router.get("/{service_id}", response_model=ServiceOut)
async def get_service(service_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다.")
    return service


@router.put("/{service_id}", response_model=ServiceOut)
async def update_service(
    service_id: str, payload: ServiceUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(service, field, value)

    await db.commit()
    await db.refresh(service)
    return service


@router.delete("/{service_id}", status_code=204)
async def delete_service(service_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다.")
    await db.delete(service)
    await db.commit()


@router.patch("/{service_id}/favorite", response_model=ServiceOut)
async def toggle_favorite(service_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다.")
    service.favorite = not service.favorite
    await db.commit()
    await db.refresh(service)
    return service
