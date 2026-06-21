import uuid
import json
import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.session import get_db, AsyncSessionLocal
from db.models import Conversation, Message, Service
from schemas.conversation import MessageOut, MessageCreate
from services.llm_gateway import llm_gateway

router = APIRouter(tags=["messages"])


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
async def list_messages(conversation_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.")

    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    return result.scalars().all()


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="대화를 찾을 수 없습니다.")

    # 사용자 메시지 저장
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=payload.content,
        model_id=payload.model_id,
        created_at=datetime.utcnow(),
    )
    db.add(user_msg)
    await db.commit()

    # 기존 메시지 히스토리 조회
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    )
    history = history_result.scalars().all()

    messages_for_llm = [
        {"role": m.role, "content": m.content} for m in history
    ]

    # 서비스 RAG 활성화 여부 확인
    use_rag = False
    rag_service_id = None
    if conv.service_id:
        svc_result = await db.execute(
            select(Service).where(Service.id == conv.service_id)
        )
        svc = svc_result.scalar_one_or_none()
        if svc and svc.rag_enabled:
            use_rag = True
            rag_service_id = conv.service_id

    async def event_stream():
        full_content = ""
        citations_data: list = []
        input_tokens = 0
        output_tokens = 0
        start_ms = int(time.time() * 1000)

        try:
            if use_rag:
                # 순환 임포트 방지를 위해 함수 내부에서 임포트
                from services.rag_service import rag_service as _rag_svc  # noqa: PLC0415

                stream_iter = _rag_svc.stream_rag_response(
                    service_id=rag_service_id,
                    query=payload.content,
                    model_id=payload.model_id,
                    history=[
                        {"role": m.role, "content": m.content}
                        for m in history[:-1]
                    ],
                )
            else:
                stream_iter = llm_gateway.stream_chat(
                    model_id=payload.model_id,
                    messages=messages_for_llm,
                )

            async for chunk in stream_iter:
                if chunk["type"] == "content":
                    full_content += chunk["delta"]
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                elif chunk["type"] == "citations":
                    citations_data = chunk.get("citations", [])
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
                elif chunk["type"] == "done":
                    usage = chunk.get("usage", {})
                    input_tokens = usage.get("input_tokens", 0)
                    output_tokens = usage.get("output_tokens", 0)
                    yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        except Exception as e:
            error_chunk = {"type": "content", "delta": f"[오류: {str(e)}]"}
            yield f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
            done_chunk = {"type": "done", "usage": {"input_tokens": 0, "output_tokens": 0}}
            yield f"data: {json.dumps(done_chunk, ensure_ascii=False)}\n\n"

        # 어시스턴트 응답 저장 (별도 세션)
        async with AsyncSessionLocal() as save_session:
            latency_ms = int(time.time() * 1000) - start_ms
            assistant_msg = Message(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role="assistant",
                content=full_content,
                model_id=payload.model_id,
                citations=citations_data if citations_data else None,
                token_count=input_tokens + output_tokens,
                created_at=datetime.utcnow(),
            )
            save_session.add(assistant_msg)

            # 대화 업데이트 시각 갱신
            conv_result = await save_session.execute(
                select(Conversation).where(Conversation.id == conversation_id)
            )
            conv_obj = conv_result.scalar_one_or_none()
            if conv_obj:
                conv_obj.updated_at = datetime.utcnow()

            await save_session.commit()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
