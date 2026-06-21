import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from schemas.playground import PlaygroundRequest
from services.llm_gateway import llm_gateway

router = APIRouter(prefix="/playground", tags=["playground"])


@router.post("/chat")
async def playground_chat(payload: PlaygroundRequest):
    messages_for_llm = [
        {"role": m.role, "content": m.content} for m in payload.messages
    ]

    async def event_stream():
        try:
            async for chunk in llm_gateway.stream_chat(
                model_id=payload.model_id,
                messages=messages_for_llm,
                system=payload.system_prompt,
                temperature=payload.temperature,
                max_tokens=payload.max_tokens,
                top_p=payload.top_p,
            ):
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        except Exception as e:
            error_chunk = {"type": "content", "delta": f"[오류: {str(e)}]"}
            yield f"data: {json.dumps(error_chunk, ensure_ascii=False)}\n\n"
            done_chunk = {"type": "done", "usage": {"input_tokens": 0, "output_tokens": 0}}
            yield f"data: {json.dumps(done_chunk, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
