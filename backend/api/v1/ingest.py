import asyncio
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.session import get_db
from db.models import Service
from services.rag_service import rag_service
from config.settings import settings

router = APIRouter(prefix="/ingest", tags=["ingest"])

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".txt", ".md", ".html", ".csv",
    ".png", ".jpg", ".jpeg", ".bmp", ".tiff",
}


@router.post("/{service_id}/upload")
async def upload_document(
    service_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """RAG 활성화 서비스에 문서를 업로드하고 인덱싱한다."""
    # 서비스 존재 및 RAG 활성화 여부 확인
    result = await db.execute(select(Service).where(Service.id == service_id))
    service = result.scalar_one_or_none()
    if not service:
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다.")
    if not service.rag_enabled:
        raise HTTPException(
            status_code=400, detail="이 서비스는 RAG가 활성화되어 있지 않습니다."
        )

    # 파일 형식 검증
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 허용: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # 임시 파일 저장
    upload_dir = Path(settings.rag_upload_dir) / service_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    temp_path = upload_dir / f"{uuid.uuid4()}{suffix}"

    try:
        content = await file.read()
        temp_path.write_bytes(content)

        # 파이프라인 실행 — 임베딩은 CPU 집약적이므로 스레드풀에서 실행
        ingest_result = await asyncio.to_thread(
            rag_service.ingest_file, service_id, temp_path
        )
        return {
            "success": True,
            "filename": file.filename,
            **ingest_result,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"문서 처리 중 오류: {str(e)}"
        ) from e
    finally:
        if temp_path.exists():
            temp_path.unlink()


@router.get("/{service_id}/docs")
async def list_docs(
    service_id: str,
    db: AsyncSession = Depends(get_db),
):
    """서비스에 인덱싱된 문서 목록을 조회한다."""
    result = await db.execute(select(Service).where(Service.id == service_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다.")
    return rag_service.list_docs(service_id)


@router.delete("/{service_id}/docs/{doc_id}", status_code=204)
async def delete_doc(
    service_id: str,
    doc_id: str,
    db: AsyncSession = Depends(get_db),
):
    """서비스에서 특정 문서를 삭제한다."""
    result = await db.execute(select(Service).where(Service.id == service_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="서비스를 찾을 수 없습니다.")
    rag_service.delete_doc(service_id, doc_id)
