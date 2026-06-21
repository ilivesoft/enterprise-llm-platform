from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from db.session import get_db
from db.models import UsageRecord, Service
from schemas.usage import KpiItem, TimeSeriesData, ProviderBreakdown, ModelBreakdown, TopService

router = APIRouter(prefix="/usage", tags=["usage"])

PROVIDER_COLORS = {
    "OpenAI": "#10A37F",
    "Anthropic": "#D97757",
    "Meta": "#0866FF",
    "Mistral": "#FF7000",
    "Google": "#4285F4",
    "Cohere": "#39594D",
    "Stability": "#6A3CE0",
    "ElevenLabs": "#111827",
    "BAAI": "#0EA5E9",
    "Upstage": "#7C3AED",
    "Microsoft": "#2563EB",
}


def _format_cost(value: float) -> str:
    if value >= 1000:
        return f"${value / 1000:.2f}K" if value < 1_000_000 else f"${value / 1_000_000:.2f}M"
    return f"${value:.2f}"


def _format_tokens(value: int) -> str:
    if value >= 1_000_000_000:
        return f"{value / 1_000_000_000:.2f}B"
    elif value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    elif value >= 1000:
        return f"{value / 1000:.1f}K"
    return str(value)


@router.get("/kpis", response_model=list[KpiItem])
async def get_kpis(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    period_start = now - timedelta(days=30)
    prev_start = period_start - timedelta(days=30)

    # 현재 기간
    curr_result = await db.execute(
        select(
            func.sum(UsageRecord.cost_usd).label("total_cost"),
            func.sum(UsageRecord.input_tokens + UsageRecord.output_tokens).label("total_tokens"),
            func.avg(UsageRecord.latency_ms).label("avg_latency"),
            func.count(UsageRecord.id).label("total_count"),
        ).where(UsageRecord.created_at >= period_start)
    )
    curr = curr_result.one()

    # 이전 기간
    prev_result = await db.execute(
        select(
            func.sum(UsageRecord.cost_usd).label("total_cost"),
            func.sum(UsageRecord.input_tokens + UsageRecord.output_tokens).label("total_tokens"),
            func.avg(UsageRecord.latency_ms).label("avg_latency"),
        ).where(
            and_(
                UsageRecord.created_at >= prev_start,
                UsageRecord.created_at < period_start,
            )
        )
    )
    prev = prev_result.one()

    def _pct_change(curr_val, prev_val) -> tuple[str, bool]:
        if not prev_val or prev_val == 0:
            return "+0.0%", True
        pct = ((curr_val - prev_val) / prev_val) * 100
        sign = "+" if pct >= 0 else ""
        return f"{sign}{pct:.1f}%", pct >= 0

    curr_cost = float(curr.total_cost or 0)
    curr_tokens = int(curr.total_tokens or 0)
    curr_latency = float(curr.avg_latency or 0)

    # 성공률 계산 (SQLite 호환: 별도 쿼리로 분리)
    total_cnt_result = await db.execute(
        select(func.count(UsageRecord.id)).where(UsageRecord.created_at >= period_start)
    )
    total_cnt = int(total_cnt_result.scalar_one() or 1)

    true_result = await db.execute(
        select(func.count(UsageRecord.id)).where(
            and_(UsageRecord.created_at >= period_start, UsageRecord.success == True)  # noqa: E712
        )
    )
    true_cnt = int(true_result.scalar_one() or 0)
    success_rate = (true_cnt / total_cnt * 100) if total_cnt > 0 else 100.0

    cost_delta, cost_up = _pct_change(curr_cost, float(prev.total_cost or 0))
    tokens_delta, tokens_up = _pct_change(curr_tokens, float(prev.total_tokens or 0))
    latency_delta, latency_up = _pct_change(curr_latency, float(prev.avg_latency or 0))

    return [
        KpiItem(id="cost", value=f"${curr_cost:,.0f}", delta=cost_delta, up=cost_up),
        KpiItem(id="tokens", value=_format_tokens(curr_tokens), delta=tokens_delta, up=tokens_up),
        KpiItem(
            id="latency",
            value=f"{int(curr_latency)}ms",
            delta=latency_delta,
            up=latency_up,
            good=not latency_up,
        ),
        KpiItem(
            id="success",
            value=f"{success_rate:.2f}%",
            delta="+0.04%",
            up=True,
        ),
    ]


@router.get("/daily-cost", response_model=TimeSeriesData)
async def get_daily_cost(
    range: str = Query("30d"),
    db: AsyncSession = Depends(get_db),
):
    days = int(range.replace("d", ""))
    now = datetime.utcnow()
    labels = []
    values = []

    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        labels.append(day_start.strftime("%Y-%m-%d"))

        result = await db.execute(
            select(func.sum(UsageRecord.cost_usd)).where(
                and_(
                    UsageRecord.created_at >= day_start,
                    UsageRecord.created_at < day_end,
                )
            )
        )
        val = result.scalar_one() or 0
        values.append(round(float(val), 2))

    return TimeSeriesData(labels=labels, values=values)


@router.get("/daily-tokens", response_model=TimeSeriesData)
async def get_daily_tokens(
    range: str = Query("30d"),
    db: AsyncSession = Depends(get_db),
):
    days = int(range.replace("d", ""))
    now = datetime.utcnow()
    labels = []
    values = []

    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        labels.append(day_start.strftime("%Y-%m-%d"))

        result = await db.execute(
            select(
                func.sum(UsageRecord.input_tokens + UsageRecord.output_tokens)
            ).where(
                and_(
                    UsageRecord.created_at >= day_start,
                    UsageRecord.created_at < day_end,
                )
            )
        )
        val = result.scalar_one() or 0
        # 백만 단위로 변환
        values.append(round(float(val) / 1_000_000, 1))

    return TimeSeriesData(labels=labels, values=values)


@router.get("/latency-trend", response_model=TimeSeriesData)
async def get_latency_trend(
    range: str = Query("30d"),
    db: AsyncSession = Depends(get_db),
):
    days = int(range.replace("d", ""))
    now = datetime.utcnow()
    labels = []
    values = []

    for i in range(days - 1, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        labels.append(day_start.strftime("%Y-%m-%d"))

        result = await db.execute(
            select(func.avg(UsageRecord.latency_ms)).where(
                and_(
                    UsageRecord.created_at >= day_start,
                    UsageRecord.created_at < day_end,
                )
            )
        )
        val = result.scalar_one() or 0
        values.append(round(float(val), 0))

    return TimeSeriesData(labels=labels, values=values)


@router.get("/provider-breakdown", response_model=list[ProviderBreakdown])
async def get_provider_breakdown(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    period_start = now - timedelta(days=30)

    result = await db.execute(
        select(
            UsageRecord.provider,
            func.sum(UsageRecord.cost_usd).label("total_cost"),
        )
        .where(UsageRecord.created_at >= period_start)
        .group_by(UsageRecord.provider)
        .order_by(func.sum(UsageRecord.cost_usd).desc())
    )
    rows = result.all()

    grand_total = sum(float(r.total_cost or 0) for r in rows)
    if grand_total == 0:
        grand_total = 1

    breakdown = []
    for row in rows:
        cost = float(row.total_cost or 0)
        pct = round(cost / grand_total * 100, 1)
        breakdown.append(
            ProviderBreakdown(
                name=row.provider,
                pct=pct,
                value=_format_cost(cost),
                color=PROVIDER_COLORS.get(row.provider, "#6B7280"),
            )
        )
    return breakdown


@router.get("/model-breakdown", response_model=list[ModelBreakdown])
async def get_model_breakdown(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    period_start = now - timedelta(days=30)

    result = await db.execute(
        select(
            UsageRecord.model_id,
            func.sum(UsageRecord.cost_usd).label("total_cost"),
        )
        .where(UsageRecord.created_at >= period_start)
        .group_by(UsageRecord.model_id)
        .order_by(func.sum(UsageRecord.cost_usd).desc())
        .limit(10)
    )
    rows = result.all()

    grand_total = sum(float(r.total_cost or 0) for r in rows)
    if grand_total == 0:
        grand_total = 1

    breakdown = []
    for row in rows:
        cost = float(row.total_cost or 0)
        pct = round(cost / grand_total * 100, 1)
        breakdown.append(
            ModelBreakdown(
                name=row.model_id,
                pct=pct,
                value=_format_cost(cost),
            )
        )
    return breakdown


@router.get("/top-services", response_model=list[TopService])
async def get_top_services(db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    period_start = now - timedelta(days=30)
    prev_start = period_start - timedelta(days=30)

    result = await db.execute(
        select(
            UsageRecord.service_id,
            func.count(UsageRecord.id).label("req_count"),
            func.sum(UsageRecord.cost_usd).label("total_cost"),
        )
        .where(UsageRecord.created_at >= period_start)
        .group_by(UsageRecord.service_id)
        .order_by(func.sum(UsageRecord.cost_usd).desc())
        .limit(5)
    )
    rows = result.all()

    services_result = await db.execute(select(Service))
    services_map = {s.id: s for s in services_result.scalars().all()}

    top_services = []
    for row in rows:
        service = services_map.get(row.service_id)
        if not service:
            continue

        # 이전 기간 대비 트렌드 계산
        prev_result = await db.execute(
            select(func.sum(UsageRecord.cost_usd)).where(
                and_(
                    UsageRecord.service_id == row.service_id,
                    UsageRecord.created_at >= prev_start,
                    UsageRecord.created_at < period_start,
                )
            )
        )
        prev_cost = float(prev_result.scalar_one() or 0)
        curr_cost = float(row.total_cost or 0)

        if prev_cost > 0:
            trend_pct = (curr_cost - prev_cost) / prev_cost * 100
            trend = f"+{trend_pct:.1f}%" if trend_pct >= 0 else f"{trend_pct:.1f}%"
        else:
            trend = "—"

        req_count = int(row.req_count or 0)
        if req_count >= 1_000_000:
            reqs_str = f"{req_count / 1_000_000:.1f}M"
        elif req_count >= 1000:
            reqs_str = f"{req_count / 1000:.0f}K"
        else:
            reqs_str = str(req_count)

        top_services.append(
            TopService(
                name=service.name,
                name_en=service.name_en,
                reqs=reqs_str,
                cost=_format_cost(curr_cost),
                trend=trend,
            )
        )
    return top_services
