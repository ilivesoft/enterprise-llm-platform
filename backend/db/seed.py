import random
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from db.session import AsyncSessionLocal
from db.models import Model, Service, Conversation, Message, UsageRecord


# 시드 데이터 정의
MODELS_DATA = [
    {
        "id": "gpt-4o",
        "name": "GPT-4o",
        "provider": "OpenAI",
        "version": "2024-11",
        "params": "—",
        "category": "text",
        "context_window": "128K",
        "tags": ["Chat", "Vision", "Function calling", "128K ctx"],
        "featured": True,
    },
    {
        "id": "gpt-4o-mini",
        "name": "GPT-4o mini",
        "provider": "OpenAI",
        "version": "2024-07",
        "params": "—",
        "category": "text",
        "context_window": "128K",
        "tags": ["Chat", "Vision", "Low cost"],
        "featured": False,
    },
    {
        "id": "claude-37",
        "name": "Claude 3.7 Sonnet",
        "provider": "Anthropic",
        "version": "20250219",
        "params": "—",
        "category": "text",
        "context_window": "200K",
        "tags": ["Chat", "Reasoning", "Vision", "200K ctx"],
        "featured": True,
    },
    {
        "id": "claude-haiku",
        "name": "Claude 3.5 Haiku",
        "provider": "Anthropic",
        "version": "20241022",
        "params": "—",
        "category": "text",
        "context_window": "200K",
        "tags": ["Chat", "Fast", "Low cost"],
        "featured": False,
    },
    {
        "id": "llama-31-70b",
        "name": "Llama 3.1 70B Instruct",
        "provider": "Meta",
        "version": "3.1",
        "params": "70B",
        "category": "text",
        "context_window": "128K",
        "tags": ["Chat", "Open weights", "Self-host"],
        "featured": False,
    },
    {
        "id": "mistral-large",
        "name": "Mistral Large 2",
        "provider": "Mistral",
        "version": "2407",
        "params": "123B",
        "category": "text",
        "context_window": "128K",
        "tags": ["Chat", "Function calling", "Multilingual"],
        "featured": False,
    },
    {
        "id": "gemini-15-pro",
        "name": "Gemini 1.5 Pro",
        "provider": "Google",
        "version": "002",
        "params": "—",
        "category": "text",
        "context_window": "2M",
        "tags": ["Chat", "Vision", "2M ctx"],
        "featured": False,
    },
    {
        "id": "command-r-plus",
        "name": "Command R+",
        "provider": "Cohere",
        "version": "08-2024",
        "params": "104B",
        "category": "text",
        "context_window": "128K",
        "tags": ["RAG", "Tool use", "Multilingual"],
        "featured": False,
    },
    {
        "id": "text-embed-3-lg",
        "name": "text-embedding-3-large",
        "provider": "OpenAI",
        "version": "v3",
        "params": "—",
        "category": "embed",
        "context_window": "8K",
        "tags": ["3072 dim", "Retrieval"],
        "featured": False,
    },
    {
        "id": "cohere-embed-v3",
        "name": "Embed v3 Multilingual",
        "provider": "Cohere",
        "version": "v3",
        "params": "—",
        "category": "embed",
        "context_window": "512",
        "tags": ["1024 dim", "100+ langs"],
        "featured": False,
    },
    {
        "id": "bge-m3",
        "name": "BGE-M3",
        "provider": "BAAI",
        "version": "m3",
        "params": "568M",
        "category": "embed",
        "context_window": "8K",
        "tags": ["Open weights", "Dense + sparse"],
        "featured": False,
    },
    {
        "id": "sd-35-large",
        "name": "Stable Diffusion 3.5 Large",
        "provider": "Stability",
        "version": "3.5",
        "params": "8.1B",
        "category": "image",
        "context_window": "—",
        "tags": ["Text-to-image", "Open weights"],
        "featured": False,
    },
    {
        "id": "dalle-3",
        "name": "DALL·E 3",
        "provider": "OpenAI",
        "version": "3",
        "params": "—",
        "category": "image",
        "context_window": "—",
        "tags": ["Text-to-image", "HD"],
        "featured": False,
    },
    {
        "id": "whisper-v3",
        "name": "Whisper large-v3",
        "provider": "OpenAI",
        "version": "v3",
        "params": "1.55B",
        "category": "speech",
        "context_window": "—",
        "tags": ["Transcription", "99 langs", "Open weights"],
        "featured": False,
    },
    {
        "id": "eleven-v2",
        "name": "Multilingual v2",
        "provider": "ElevenLabs",
        "version": "v2",
        "params": "—",
        "category": "speech",
        "context_window": "—",
        "tags": ["Text-to-speech", "29 langs"],
        "featured": False,
    },
    {
        "id": "bge-rerank",
        "name": "bge-reranker-v2-m3",
        "provider": "BAAI",
        "version": "v2-m3",
        "params": "568M",
        "category": "rerank",
        "context_window": "8K",
        "tags": ["Cross-encoder", "Open weights"],
        "featured": False,
    },
    {
        "id": "cohere-rerank",
        "name": "Rerank 3",
        "provider": "Cohere",
        "version": "3",
        "params": "—",
        "category": "rerank",
        "context_window": "4K",
        "tags": ["Relevance", "100+ langs"],
        "featured": False,
    },
    {
        "id": "upstage-ocr",
        "name": "Document Parse OCR",
        "provider": "Upstage",
        "version": "1.1",
        "params": "—",
        "category": "ocr",
        "context_window": "—",
        "tags": ["Layout", "Tables", "KR + EN"],
        "featured": False,
    },
]

SERVICES_DATA = [
    {
        "id": "s1",
        "name": "고객지원 어시스턴트",
        "name_en": "Customer Support Assistant",
        "model_id": "claude-37",
        "provider": "Anthropic",
        "rag_enabled": True,
        "status": "running",
        "favorite": True,
        "requests_30d": "1.2M",
        "avg_latency": "740ms",
    },
    {
        "id": "s2",
        "name": "사내 지식 검색",
        "name_en": "Internal Knowledge Search",
        "model_id": "gpt-4o",
        "provider": "OpenAI",
        "rag_enabled": True,
        "status": "running",
        "favorite": True,
        "requests_30d": "842K",
        "avg_latency": "910ms",
    },
    {
        "id": "s3",
        "name": "계약서 분석 파이프라인",
        "name_en": "Contract Analysis Pipeline",
        "model_id": "mistral-large",
        "provider": "Mistral",
        "rag_enabled": True,
        "status": "training",
        "favorite": False,
        "requests_30d": "64K",
        "avg_latency": "1.4s",
    },
    {
        "id": "s4",
        "name": "마케팅 카피 생성기",
        "name_en": "Marketing Copy Generator",
        "model_id": "gpt-4o-mini",
        "provider": "OpenAI",
        "rag_enabled": False,
        "status": "running",
        "favorite": False,
        "requests_30d": "410K",
        "avg_latency": "520ms",
    },
    {
        "id": "s5",
        "name": "음성 회의록 작성",
        "name_en": "Meeting Transcriber",
        "model_id": "whisper-v3",
        "provider": "OpenAI",
        "rag_enabled": False,
        "status": "stopped",
        "favorite": False,
        "requests_30d": "88K",
        "avg_latency": "—",
    },
    {
        "id": "s6",
        "name": "제품 이미지 생성",
        "name_en": "Product Image Studio",
        "model_id": "sd-35-large",
        "provider": "Stability",
        "rag_enabled": False,
        "status": "building",
        "favorite": False,
        "requests_30d": "12K",
        "avg_latency": "3.1s",
    },
    {
        "id": "s7",
        "name": "재무 리포트 Q&A",
        "name_en": "Financial Report Q&A",
        "model_id": "gemini-15-pro",
        "provider": "Google",
        "rag_enabled": True,
        "status": "running",
        "favorite": True,
        "requests_30d": "203K",
        "avg_latency": "1.1s",
    },
    {
        "id": "s8",
        "name": "코드 리뷰 봇",
        "name_en": "Code Review Bot",
        "model_id": "llama-31-70b",
        "provider": "Meta",
        "rag_enabled": True,
        "status": "error",
        "favorite": False,
        "requests_30d": "156K",
        "avg_latency": "—",
    },
    {
        "id": "s9",
        "name": "다국어 번역 게이트웨이",
        "name_en": "Translation Gateway",
        "model_id": "command-r-plus",
        "provider": "Cohere",
        "rag_enabled": False,
        "status": "running",
        "favorite": False,
        "requests_30d": "521K",
        "avg_latency": "680ms",
    },
]

CONVERSATIONS_DATA = [
    {
        "id": "c1",
        "title": "4분기 매출 분석 요약",
        "title_en": "Q4 revenue analysis",
        "service_id": "s7",
        "created_at": datetime.utcnow() - timedelta(hours=2),
    },
    {
        "id": "c2",
        "title": "RAG 파이프라인 설계 검토",
        "title_en": "RAG pipeline review",
        "service_id": "s2",
        "created_at": datetime.utcnow() - timedelta(hours=5),
    },
    {
        "id": "c3",
        "title": "고객 이탈 원인 가설",
        "title_en": "Churn hypotheses",
        "service_id": "s1",
        "created_at": datetime.utcnow() - timedelta(days=1, hours=3),
    },
    {
        "id": "c4",
        "title": "온보딩 이메일 카피 작성",
        "title_en": "Onboarding email copy",
        "service_id": "s4",
        "created_at": datetime.utcnow() - timedelta(days=2),
    },
    {
        "id": "c5",
        "title": "GDPR 컴플라이언스 체크리스트",
        "title_en": "GDPR checklist",
        "service_id": None,
        "created_at": datetime.utcnow() - timedelta(days=4),
    },
    {
        "id": "c6",
        "title": "경쟁사 기능 비교표",
        "title_en": "Competitor feature matrix",
        "service_id": None,
        "created_at": datetime.utcnow() - timedelta(days=10),
    },
    {
        "id": "c7",
        "title": "제품 설명 번역 (KR→EN)",
        "title_en": "Product copy translation",
        "service_id": "s9",
        "created_at": datetime.utcnow() - timedelta(days=25),
    },
]

MESSAGES_DATA = [
    {
        "id": "m1",
        "conversation_id": "c1",
        "role": "user",
        "content": "4분기 매출 데이터를 분석하고 주요 트렌드를 요약해줘.",
        "model_id": "gemini-15-pro",
        "citations": None,
        "token_count": 32,
    },
    {
        "id": "m2",
        "conversation_id": "c1",
        "role": "assistant",
        "content": "4분기 매출 분석 결과를 다음과 같이 요약드립니다:\n\n**주요 지표**\n- 총 매출: 전분기 대비 +12.4% 성장\n- 신규 고객: 1,847명 유입\n- 평균 거래액: $2,340 (전분기 $2,105 대비 +11.2%)\n\n**채널별 성과**\n1. 엔터프라이즈 세그먼트: 전체 매출의 68% 차지, YoY +18%\n2. SMB 세그먼트: 전체의 32%, YoY +6%\n\n**주목할 트렌드**\n- API 구독 모델 전환율 급증 (+34%)\n- APAC 지역 성장률 가장 높음 (+27%)\n- 평균 계약 기간 18개월로 연장",
        "model_id": "gemini-15-pro",
        "citations": ["revenue_q4_2024.pdf", "customer_analytics.csv"],
        "token_count": 186,
    },
    {
        "id": "m3",
        "conversation_id": "c1",
        "role": "user",
        "content": "APAC 지역 성장 요인을 더 자세히 분석해줘.",
        "model_id": "gemini-15-pro",
        "citations": None,
        "token_count": 28,
    },
    {
        "id": "m4",
        "conversation_id": "c1",
        "role": "assistant",
        "content": "APAC 지역 성장 분석 결과입니다:\n\n**핵심 성장 동인**\n1. **일본 시장 진출**: Q4에 공식 파트너십 계약 체결로 엔터프라이즈 고객 43개사 신규 유입\n2. **한국 금융권 확대**: KB, 신한 등 대형 금융기관의 LLM 게이트웨이 도입\n3. **싱가포르 허브 효과**: 동남아시아 확장의 거점으로 리셀러 네트워크 14개사 구축\n\n**지역별 세부 현황**\n| 국가 | 성장률 | 주요 버티컬 |\n|------|--------|-------------|\n| 일본 | +42% | 금융, 제조 |\n| 한국 | +31% | 금융, 이커머스 |\n| 싱가포르 | +28% | 핀테크, 헬스케어 |\n| 호주 | +19% | 공공, 리테일 |",
        "model_id": "gemini-15-pro",
        "citations": ["apac_growth_report.pdf"],
        "token_count": 247,
    },
]


def _generate_usage_records() -> list[dict]:
    """30일치 UsageRecord 생성 (총 $48,210, 1.84B 토큰, 812ms 평균, 99.82% 성공률 목표)"""
    records = []
    now = datetime.utcnow()

    # 프로바이더 배분: OpenAI 45%, Anthropic 30%, Google 12%, Cohere 7%, Mistral 6%
    provider_configs = [
        {
            "provider": "OpenAI",
            "models": ["gpt-4o", "gpt-4o-mini"],
            "services": ["s2", "s4"],
            "daily_cost_base": 720,
            "tokens_base": 28_000_000,
            "latency_base": 780,
        },
        {
            "provider": "Anthropic",
            "models": ["claude-37", "claude-haiku"],
            "services": ["s1"],
            "daily_cost_base": 490,
            "tokens_base": 18_000_000,
            "latency_base": 850,
        },
        {
            "provider": "Google",
            "models": ["gemini-15-pro"],
            "services": ["s7"],
            "daily_cost_base": 190,
            "tokens_base": 8_000_000,
            "latency_base": 920,
        },
        {
            "provider": "Cohere",
            "models": ["command-r-plus"],
            "services": ["s9"],
            "daily_cost_base": 115,
            "tokens_base": 5_000_000,
            "latency_base": 700,
        },
        {
            "provider": "Mistral",
            "models": ["mistral-large"],
            "services": ["s3"],
            "daily_cost_base": 92,
            "tokens_base": 3_000_000,
            "latency_base": 1200,
        },
    ]

    record_id_base = 0
    for day_offset in range(30):
        record_date = now - timedelta(days=29 - day_offset)
        # 주말 트래픽 감소 효과
        day_of_week = record_date.weekday()
        multiplier = 0.6 if day_of_week >= 5 else 1.0
        # 마지막 주 트래픽 증가 트렌드 반영
        trend = 1.0 + (day_offset / 30) * 0.15

        for config in provider_configs:
            # 하루 5~6개 레코드/프로바이더
            for i in range(random.randint(4, 7)):
                record_id_base += 1
                model_id = random.choice(config["models"])
                service_id = random.choice(config["services"])

                jitter = random.uniform(0.7, 1.4)
                input_tokens = int(config["tokens_base"] / 30 / 5 * multiplier * trend * jitter * 0.7)
                output_tokens = int(config["tokens_base"] / 30 / 5 * multiplier * trend * jitter * 0.3)
                cost_usd = config["daily_cost_base"] / 30 / 5 * multiplier * trend * jitter
                latency_ms = int(config["latency_base"] * random.uniform(0.6, 1.6))
                # 0.18% 실패율
                success = random.random() > 0.0018

                records.append(
                    {
                        "service_id": service_id,
                        "model_id": model_id,
                        "provider": config["provider"],
                        "input_tokens": max(100, input_tokens),
                        "output_tokens": max(50, output_tokens),
                        "cost_usd": round(cost_usd, 4),
                        "latency_ms": max(100, latency_ms),
                        "success": success,
                        "created_at": record_date.replace(
                            hour=random.randint(0, 23),
                            minute=random.randint(0, 59),
                        ),
                    }
                )

    return records


async def seed_database():
    """데이터베이스 초기 데이터 삽입 (멱등적)"""
    async with AsyncSessionLocal() as session:
        # 모델 데이터 삽입
        result = await session.execute(select(Model).limit(1))
        if result.scalar_one_or_none() is None:
            for data in MODELS_DATA:
                model = Model(**data)
                session.add(model)
            await session.commit()

        # 서비스 데이터 삽입
        result = await session.execute(select(Service).limit(1))
        if result.scalar_one_or_none() is None:
            for data in SERVICES_DATA:
                service = Service(**data)
                session.add(service)
            await session.commit()

        # 대화 데이터 삽입
        result = await session.execute(select(Conversation).limit(1))
        if result.scalar_one_or_none() is None:
            for data in CONVERSATIONS_DATA:
                conv = Conversation(**data)
                session.add(conv)
            await session.commit()

            # 대화 메시지 삽입
            for data in MESSAGES_DATA:
                msg = Message(**data)
                session.add(msg)
            await session.commit()

        # 사용량 레코드 삽입
        result = await session.execute(select(UsageRecord).limit(1))
        if result.scalar_one_or_none() is None:
            for data in _generate_usage_records():
                record = UsageRecord(**data)
                session.add(record)
            await session.commit()
