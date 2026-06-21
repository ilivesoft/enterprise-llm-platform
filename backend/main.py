from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config.settings import settings
from db.session import engine
from db.models import Base
from db.seed import seed_database
from api.v1.router import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 테이블 생성 및 시드 데이터 삽입
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_database()
    yield
    # 종료 시 엔진 정리
    await engine.dispose()


app = FastAPI(
    title="Enterprise LLM Platform API",
    version="1.0.0",
    description="엔터프라이즈 LLM 게이트웨이 플랫폼 API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}
