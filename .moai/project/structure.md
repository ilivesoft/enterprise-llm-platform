# 프로젝트 구조 — 엔터프라이즈 LLM 운영 플랫폼

## 디렉토리 트리 (2단계)

```
enterprise-llm-platform/
├── backend/                     # Python FastAPI 백엔드 (LLM 게이트웨이, RAG, DB)
│   ├── api/v1/                  # REST API 라우터 (v1 버전 명시)
│   ├── services/                # 비즈니스 로직 계층 (LLM 게이트웨이, RAG, 분석)
│   ├── pipeline/                # RAG 파이프라인 모듈 (파싱, 청킹, 임베딩, 검색)
│   ├── db/                      # SQLAlchemy 데이터베이스 모델 및 세션 관리
│   ├── config/                  # Pydantic 설정 및 환경변수 로딩
│   ├── schemas/                 # Pydantic 요청/응답 데이터 모델
│   ├── storage/                 # 파일 업로드 및 벡터DB (ChromaDB) 저장소
│   ├── main.py                  # FastAPI 애플리케이션 진입점 (Uvicorn 호스팅)
│   └── requirements.txt          # Python 의존성 명시
├── frontend/                    # React 19 + TypeScript SPA (사용자 인터페이스)
│   ├── src/
│   │   ├── pages/               # 주요 페이지 컴포넌트 (대화, 서비스, 대시보드)
│   │   ├── components/          # 재사용 UI 컴포넌트 (사이드바, 입력창, 차트)
│   │   ├── contexts/            # React Context (테마, 언어, 알림)
│   │   ├── lib/                 # 유틸리티 (HTTP 클라이언트, 포매터)
│   │   ├── types/               # TypeScript 도메인 타입 정의
│   │   └── main.tsx             # React 진입점 (BrowserRouter)
│   ├── package.json             # Node.js 의존성 및 스크립트
│   └── vite.config.ts           # Vite 빌드 설정
├── refsource/                   # RAG 참고 구현 문서 (외부 학습용)
├── docs/                        # 프로젝트 문서 (핸드오프 ZIP, 아키텍처)
├── .moai/                       # MoAI 프로젝트 설정 디렉토리
│   ├── project/                 # 프로젝트 메타데이터
│   ├── config/                  # 워크플로우 설정
│   └── specs/                   # SPEC 문서 저장소
├── .claude/                     # Claude Code 설정 (규칙, 스킬)
│   ├── rules/                   # MoAI 아키텍처 규칙
│   └── settings.json            # 프로젝트별 Claude Code 설정
├── CLAUDE.md                    # MoAI 실행 지시문 (핵심 규칙)
└── README.md                    # 프로젝트 개요 및 시작 가이드
```

---

## 아키텍처 패턴

### 계층별 아키텍처 (Layered Architecture with RAG Integration)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
│  Frontend (React 19 SPA)                                    │
│  - ChatWorkspace (대화 인터페이스)                            │
│  - Services (서비스 관리)                                     │
│  - Playground (프롬프트 테스트)                               │
│  - Dashboard (분석 및 비용)                                   │
│  - Marketplace (모델 카탈로그)                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
          (HTTP / REST API / JSON)
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY LAYER                        │
│  FastAPI (backend/api/v1/)                                  │
│  - MessageRouter (/messages/)                               │
│  - ConversationRouter (/conversations/)                     │
│  - ServiceRouter (/services/)                               │
│  - ModelRouter (/models/)                                   │
│  - IngestRouter (/ingest/) — 문서 업로드                     │
│  - PlaygroundRouter (/playground/)                          │
│  - AnalyticsRouter (/analytics/)                            │
│  - ApiKeyRouter (/apikeys/)                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
        (비즈니스 로직 호출 / 데이터 조작)
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                       │
│  Services (backend/services/)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ LLMGateway Service                                   │   │
│  │ - OpenAI (GPT-4o, GPT-4 Turbo)                       │   │
│  │ - Anthropic (Claude 3, Claude 3.5)                   │   │
│  │ - Mock Provider (테스트/개발)                         │   │
│  │ - 스트리밍 응답 (SSE)                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ RAGService (RAG 파이프라인 관리)                       │   │
│  │ - 문서 수집 및 검색                                    │   │
│  │ - 하이브리드 검색 조율                                  │   │
│  │ - 응답 생성 (LLM과 협력)                               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ UsageTracker Service                                 │   │
│  │ - 토큰 사용량 기록                                     │   │
│  │ - 비용 계산 (모델별 가격)                              │   │
│  │ - 응답 시간 측정                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 기타 Services                                        │   │
│  │ - ConversationService                                │   │
│  │ - ServiceRegistry                                    │   │
│  │ - ApiKeyManager                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────────────┬────────────────┘
                │                             │
                ▼                             ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │  RAG PIPELINE LAYER  │    │  PERSISTENCE LAYER   │
    └──────────────────────┘    └──────────────────────┘
            │                            │
            │ (backend/pipeline/)        │ (backend/db/)
            │                            │
            ├─ Parser                    ├─ SQLAlchemy ORM
            │  (PDF, DOCX, TXT)          │  Models:
            │                            │  - Model
            ├─ Chunker                   │  - Service
            │  (청크 생성)                 │  - Conversation
            │                            │  - Message
            ├─ Embedder                  │  - UsageRecord
            │  (BAAI/bge-m3)             │  - ApiKey
            │                            │
            ├─ Vectorstore               ├─ SQLite DB
            │  (ChromaDB)                │  (개발 환경)
            │                            │
            ├─ Retriever                 ├─ Async Session
            │  (BM25 + Dense)            │  (SQLAlchemy 2.0)
            │                            │
            ├─ Reranker                  └─ Connection Pool
            │  (CrossEncoder)            
            │
            └─ Generator
               (LLMGateway와 협력)
```

---

## 모듈 상호작용 흐름

### 시나리오: 사용자가 "고객 지원" 서비스에 질문 제시

```
┌─────────────┐
│   Frontend  │  /messages (POST)
│  ChatUI     │  { service_id: "svc-001", query: "환불 정책은?" }
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│ API Gateway (v1/messages)│
│ - 요청 검증               │
│ - 서비스 ID 확인           │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────────┐
│ RAGService.generate_response │
│ (backend/services/rag_service.py)
└──────┬───────────────────────┘
       │
       ├─ 1. 문서 검색 (Retriever)
       │     ├─ BM25 검색 (ChromaDB 쿼리)
       │     ├─ 밀집 벡터 검색 (Embedding)
       │     └─ 결합 및 상위 K개 선택
       │
       ├─ 2. 재순위 지정 (Reranker)
       │     ├─ CrossEncoder 스코어링
       │     └─ 상위 3개 청크 선택
       │
       ├─ 3. 프롬프트 구성
       │     ├─ 시스템 프롬프트 + 검색 결과 + 사용자 질문
       │     └─ 함수 정의 포함 (필요시)
       │
       ├─ 4. LLM 호출 (LLMGateway)
       │     ├─ 서비스의 모델 선택 (GPT-4o 또는 Claude)
       │     ├─ 스트리밍 응답 활성화
       │     └─ 토큰 사용량 측정
       │
       ├─ 5. 사용량 기록 (UsageTracker)
       │     ├─ 입력 토큰 기록
       │     ├─ 출력 토큰 기록
       │     ├─ 비용 계산 (모델별 가격)
       │     └─ 응답 시간 저장
       │
       └─ 6. DB 저장 (Message + Citation)
           ├─ Message 레코드 생성
           │  { user_query, ai_response, token_usage }
           ├─ Citation 레코드 생성
           │  { source_document, page, score }
           └─ SQLAlchemy로 저장
           
       ▼
┌──────────────────────────┐
│ Frontend (ChatUI)        │
│ - 스트리밍 응답 수신 (SSE)│
│ - 인용 출처 표시         │
│ - 토큰 비용 표시         │
└──────────────────────────┘
```

---

## 핵심 파일 위치

### 진입점 (Entry Points)

| 진입점 | 경로 | 설명 |
|--------|------|------|
| Backend 서버 | `backend/main.py` | FastAPI 애플리케이션 (Uvicorn에서 실행) |
| Frontend 앱 | `frontend/src/main.tsx` | React StrictMode + BrowserRouter |
| 헬스 체크 | `GET /health` | `{"status": "ok", "version": "1.0.0"}` 반환 |

### 설정 파일

| 파일 | 용도 |
|------|------|
| `backend/config/settings.py` | 환경변수 로딩 (Pydantic Settings) |
| `frontend/vite.config.ts` | Vite 빌드 설정 |
| `backend/requirements.txt` | Python 의존성 |
| `frontend/package.json` | Node.js 의존성 |

### 핵심 모듈

| 모듈 | 경로 | 책임 |
|------|------|------|
| LLM Gateway | `backend/services/llm_gateway.py` | OpenAI, Anthropic 통합 |
| RAG Service | `backend/services/rag_service.py` | RAG 파이프라인 조율 |
| Parser | `backend/pipeline/parser.py` | PDF/DOCX 파싱 |
| Embedder | `backend/pipeline/embedder.py` | BAAI/bge-m3 벡터 생성 |
| Retriever | `backend/pipeline/retriever.py` | 하이브리드 검색 (BM25 + Dense) |
| Reranker | `backend/pipeline/reranker.py` | CrossEncoder 재순위 지정 |
| Generator | `backend/pipeline/generator.py` | 응답 생성 (인용 포함) |
| Message API | `backend/api/v1/messages.py` | `/messages` 라우터 |
| Conversation API | `backend/api/v1/conversations.py` | `/conversations` 라우터 |
| Service API | `backend/api/v1/services.py` | `/services` 라우터 |
| Ingest API | `backend/api/v1/ingest.py` | 문서 업로드 (`/ingest`) |
| Analytics API | `backend/api/v1/analytics.py` | 사용량 분석 (`/analytics`) |

### 데이터 모델 (DB)

| 모델 | 경로 | 설명 |
|------|------|------|
| Model | `backend/db/models.py` | LLM/모델 카탈로그 |
| Service | `backend/db/models.py` | 사용자 서비스 인스턴스 |
| Conversation | `backend/db/models.py` | 대화 스레드 (서비스 범위) |
| Message | `backend/db/models.py` | 개별 메시지 + 인용 |
| UsageRecord | `backend/db/models.py` | 토큰, 비용, 지연시간 |
| ApiKey | `backend/db/models.py` | API 키 및 권한 |

### RAG 저장소

| 구성 | 경로 | 설명 |
|------|------|------|
| 벡터DB | `backend/storage/chroma/` | ChromaDB (서비스별 컬렉션) |
| 파일 업로드 | `backend/storage/uploads/` | 사용자 문서 임시 저장 |
| 청킹 캐시 | `backend/storage/chunks/` | 파싱된 청크 캐시 (선택사항) |

---

## 모듈 경계 설명

### 왜 이렇게 분리되어 있는가?

#### 1. **API Gateway ↔ Business Logic 분리**
- **경계**: `backend/api/v1/` vs `backend/services/`
- **이유**: 
  - API 라우터는 요청 직렬화/역직렬화만 담당
  - 서비스는 도메인 로직에만 집중 (재사용성 높음)
  - 같은 로직을 여러 엔드포인트에서 호출 가능 (예: PlaygroundRouter와 MessageRouter 모두 `llm_gateway.generate()`를 호출)

#### 2. **RAG Pipeline 단계별 분리**
- **경계**: `backend/pipeline/parser.py`, `chunker.py`, `embedder.py`, `retriever.py`, `reranker.py`, `generator.py`
- **이유**:
  - 각 단계가 독립적으로 테스트 가능
  - 단계별 성능 측정 가능 (예: Parser가 느리면 개선 집중)
  - 다른 파이프라인 구현으로 쉽게 교체 가능 (예: CrossEncoder 대신 다른 재순위 모델 사용)
  - 각 단계의 캐싱 가능 (예: 임베딩은 비용이 크므로 재사용)

#### 3. **LLMGateway ↔ 특정 제공자 분리**
- **경계**: `backend/services/llm_gateway.py` vs `backend/services/providers/`
- **이유**:
  - 새로운 LLM 제공자(예: Llama 2, Mistral) 추가 시 Gateway 코드 변경 안 함
  - 제공자별 에러 처리 로직을 독립적으로 관리
  - 페일오버 로직(한 제공자 실패 → 다른 제공자로 전환)을 간단히 구현

#### 4. **DB ↔ Services 분리**
- **경계**: `backend/db/` vs `backend/services/`
- **이유**:
  - 데이터 접근 로직 (SQLAlchemy ORM)은 DB 모듈만
  - 비즈니스 로직 (RAG, LLM 호출)은 Services 모듈
  - DB를 PostgreSQL로 변경하려면 `backend/db/models.py`만 수정 (Services는 영향 없음)

#### 5. **Frontend ↔ Backend 완전 분리**
- **경계**: `frontend/` vs `backend/`
- **이유**:
  - 다른 언어 (TypeScript vs Python), 다른 프레임워크 (React vs FastAPI)
  - 프론트엔드 UI 변경이 백엔드 로직 영향 없음
  - REST API로만 통신하므로, 모바일 앱을 나중에 추가해도 백엔드 재사용 가능

#### 6. **Storage ↔ Pipeline 분리**
- **경계**: `backend/storage/` vs `backend/pipeline/`
- **이유**:
  - 벡터DB (ChromaDB)가 특정 서비스에 종속되지 않음
  - 향후 다른 벡터DB (Pinecone, Weaviate)로 교체 가능
  - 파이프라인은 저장소 인터페이스에만 의존 (구체적 구현은 모름)

---

## 통신 패턴

### 동기 호출 (Synchronous)
- Frontend → Backend: 대부분의 HTTP 요청 (요청-응답)
- Backend 내부: Services 간 메서드 호출

**예**: `frontend/src/lib/http.ts`의 `axios.post("/messages/")` → Backend의 `MessageRouter.create_message()`

### 비동기 호출 (Asynchronous / Streaming)
- Backend → Frontend: 스트리밍 응답 (SSE)
  
**예**: LLM이 토큰을 하나씩 생성할 때마다 프론트엔드가 실시간으로 받음

```python
# backend/api/v1/messages.py
@router.post("/", response_class=StreamingResponse)
async def create_message(req: MessageRequest):
    async def event_generator():
        async for chunk in rag_service.generate_response_stream(req.query):
            yield f"data: {chunk}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

---

## 의존성 흐름

```
Frontend
  ↓
API Gateway (v1/*)
  ↓
Services (llm_gateway, rag_service, usage_tracker, ...)
  ├─ LLMGateway
  │   ├─ OpenAI API
  │   ├─ Anthropic API
  │   └─ Mock Provider
  │
  ├─ RAGService
  │   └─ Pipeline (parser → chunker → embedder → retriever → reranker → generator)
  │       ├─ Parser (PyMuPDF, python-docx)
  │       ├─ Embedder (sentence-transformers)
  │       ├─ Retriever (ChromaDB, rank-bm25)
  │       └─ Reranker (sentence-transformers CrossEncoder)
  │
  └─ UsageTracker
      └─ DB (SQLAlchemy)

Database
  ├─ SQLite (개발)
  └─ (프로덕션: PostgreSQL)

VectorDB
  └─ ChromaDB
```

**핵심**: 상위 레이어는 하위 레이어에만 의존 (역방향 의존 없음)
- 변경 영향: 아래층 변경 → 위층에 영향 / 위층 변경 → 아래층 무영향
