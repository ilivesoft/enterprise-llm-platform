from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from db.models import UsageRecord


class UsageTracker:
    """토큰 및 비용 추적 서비스."""

    async def record(
        self,
        session: AsyncSession,
        service_id: str,
        model_id: str,
        provider: str,
        input_tokens: int,
        output_tokens: int,
        cost_usd: float,
        latency_ms: int,
        success: bool = True,
    ) -> None:
        record = UsageRecord(
            service_id=service_id,
            model_id=model_id,
            provider=provider,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            success=success,
            created_at=datetime.utcnow(),
        )
        session.add(record)
        await session.commit()


usage_tracker = UsageTracker()
