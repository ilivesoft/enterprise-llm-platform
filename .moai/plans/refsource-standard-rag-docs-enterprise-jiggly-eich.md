# Plan: Enterprise LLM Platform 구현

## Context

Claude Design에서 제작한 "Enterprise AI Platform · iLive" 목업을 기반으로 실제 동작하는 플랫폼을 구현한다.
ZIP 핸드오프 번들에서 JSX 소스 파일과 디자인 시스템을 추출해 완전히 파악했다.

**핵심 발견:** 이것은 단순 RAG 시스템이 아닌 **멀티 프로바이더 LLM 게이트웨이 플랫폼**이다.
`refsource/standard-rag`는 RAG 기능(AI Services의 `rag: true` 서비스)에서만 참고한다.

---

## 화면 구조 (JSX 분석 결과)

| 라우트 | 페이지 | 주요 기능 |
|-------|-------|---------|
| `chat` (기본) | Chat Workspace | 대화 목록 · 멀티모델 채팅 · RAG 인용 패널 · SSE 스트리밍 |
| `services` | AI Services | 서비스 CRUD · 상태 모니터링 · Grid/Table 뷰 |
| `dashboard` | Cost & Usage | KPI 카드 · 일별 비용 차트 · 프로바이더별 도넛 · 레이턴시 트렌드 |
| `marketplace` | Model Marketplace | 모델 탐색 · 카테고리 필터 · 3가지 카드 스타일 |
| `playground` | Playground | 모델 선택 · 파라미터 설정 · Function calling · Deep thinking |

**사이드바 하단:** API Keys, Settings, 사용자 프로필 (정기현 · Acme Corp · Admin)

---

## 목표 아키텍처

```
enterprise-llm-platform/
├── backend/                   ← FastAPI (신규 작성)
│   ├── main.py               # 앱 진입점 + CORS
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/settings.py    # pydantic-settings
│   ├── db/
│   │   ├── models.py         # SQLAlchemy 모델
│   │   └── session.py        # DB 세션
│   ├── api/v1/
│   │   ├── router.py         # 통합 라우터
│   │   ├── models.py         # 모델 마켓플레이스
│   │   ├── services.py       # AI 서비스 CRUD
│   │   ├── conversations.py  # 대화 관리
│   │   ├── messages.py       # 메시지 + SSE 스트리밍
│   │   ├── usage.py          # 비용/사용량 통계
│   │   ├── playground.py     # 플레이그라운드
│   │   └── api_keys.py       # API 키 관리
│   ├── schemas/              # Pydantic 요청/응답
│   │   ├── model.py
│   │   ├── service.py
│   │   ├── conversation.py
│   │   ├── usage.py
│   │   └── playground.py
│   ├── services/             # 비즈니스 로직
│   │   ├── llm_gateway.py    # 멀티 프로바이더 LLM 게이트웨이
│   │   ├── rag_service.py    # RAG 파이프라인 (standard-rag 참고)
│   │   └── usage_tracker.py  # 토큰/비용 추적
│   └── pipeline/             # RAG 전용 (standard-rag 스펙 참고, 신규 작성)
│       ├── parser.py, chunker.py, embedder.py
│       ├── vectorstore.py, retriever.py, reranker.py
│       └── generator.py
│
└── frontend/                  ← React (JSX 소스 기반, Vite로 전환)
    ├── package.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx            # 라우팅 + 테마 + 언어 컨텍스트
        ├── data/              # 타입 정의 (data.jsx → TypeScript)
        ├── components/
        │   ├── chrome/        # Sidebar, TopBar, Brand
        │   ├── primitives/    # Icon, LogoTile, Avatar, Badge 등
        │   ├── charts/        # AreaChart, BarChart, LineChart, Donut
        │   └── ui/            # SearchField, Segmented, Switch, Empty
        └── pages/
            ├── ChatWorkspace.tsx
            ├── Services.tsx
            ├── Dashboard.tsx
            ├── Marketplace.tsx
            └── Playground.tsx
```

---

## 백엔드 API 설계 (화면 기반 도출)

### Models (마켓플레이스)
```
GET  /api/v1/models              # 전체 모델 목록 (카테고리/프로바이더 필터)
GET  /api/v1/models/{id}         # 모델 상세
```

### Services (AI 서비스 관리)
```
GET    /api/v1/services           # 서비스 목록 (상태/검색 필터)
POST   /api/v1/services           # 서비스 생성
GET    /api/v1/services/{id}      # 서비스 상세
PUT    /api/v1/services/{id}      # 서비스 수정
DELETE /api/v1/services/{id}      # 서비스 삭제
PATCH  /api/v1/services/{id}/favorite  # 즐겨찾기 토글
```

### Conversations (채팅)
```
GET  /api/v1/conversations              # 대화 목록 (그룹: 오늘/어제/지난7일/지난30일)
POST /api/v1/conversations              # 새 대화 생성
GET  /api/v1/conversations/{id}/messages   # 메시지 목록
POST /api/v1/conversations/{id}/messages   # 메시지 전송 (SSE 스트리밍)
```

### Usage / Dashboard
```
GET /api/v1/usage/kpis              # KPI 카드 (비용, 토큰, 레이턴시, 성공률)
GET /api/v1/usage/daily-cost        # 일별 비용 시계열 (?range=7d|30d|90d)
GET /api/v1/usage/daily-tokens      # 일별 토큰 시계열
GET /api/v1/usage/latency-trend     # 레이턴시 추이
GET /api/v1/usage/provider-breakdown  # 프로바이더별 비용 (도넛 차트용)
GET /api/v1/usage/model-breakdown    # 모델별 비용 (수평 바 차트용)
GET /api/v1/usage/top-services       # 상위 서비스 (비용 기준)
```

### Playground
```
POST /api/v1/playground/chat        # 테스트 메시지 (SSE 스트리밍)
```

### API Keys
```
GET    /api/v1/api-keys             # API 키 목록
POST   /api/v1/api-keys             # 키 생성
DELETE /api/v1/api-keys/{id}        # 키 삭제
```

### Health
```
GET /health                         # 서비스 상태
```

---

## 데이터 모델 (SQLAlchemy)

**Model** — id, name, provider, version, params, category, context_window, tags[], featured, updated_at  
**Service** — id, name, model_id, provider, rag_enabled, status, favorite, requests_30d, avg_latency_ms, created_at  
**Conversation** — id, title, service_id, created_at, updated_at  
**Message** — id, conversation_id, role, content, model_id, citations[], token_count, created_at  
**UsageRecord** — id, service_id, model_id, provider, input_tokens, output_tokens, cost_usd, latency_ms, success, created_at  
**ApiKey** — id, name, key_hash, last_used_at, created_at  

---

## LLM 게이트웨이 (services/llm_gateway.py)

멀티 프로바이더 통합 — 우선순위:
1. OpenAI (`gpt-4o`, `gpt-4o-mini`, `text-embedding-3-large`, `whisper-v3`, `dall-e-3`)
2. Anthropic (`claude-3-7-sonnet`, `claude-3-5-haiku`)
3. Cohere (`command-r-plus`, `embed-v3-multilingual`, `rerank-3`)
4. Google (`gemini-1.5-pro`)

**초기 구현:** OpenAI + Anthropic만 실제 연결, 나머지는 목 응답.  
SSE 스트리밍은 `StreamingResponse` + `EventSourceResponse` 패턴 사용.

**RAG 서비스** (`rag: true`인 서비스): standard-rag 파이프라인 참고 신규 작성.  
- 임베딩: BAAI/bge-m3 또는 OpenAI text-embedding-3-large (환경변수로 선택)  
- 벡터 저장소: ChromaDB  
- 검색: 하이브리드 (Vector + BM25 + RRF)  
- 리랭커: cross-encoder/ms-marco-MiniLM-L-6-v2  

---

## 프론트엔드 전환 전략

JSX 원본 파일을 기반으로 Vite + React + TypeScript 프로젝트로 전환한다.

**보존:**
- 모든 컴포넌트 로직과 레이아웃 구조 (가능한 한 pixel-perfect)
- CSS 변수 시스템 (`styles.css`의 `--bg`, `--accent`, `--border` 등)
- iLive 디자인 시스템 CSS (`colors_and_type.css`, `components.css`)
- Pretendard Variable 폰트

**전환:**
- `React.useState` → `useState` import
- `window.*` globals → TypeScript module exports
- `Object.assign(window, {...})` → named exports
- `TWEAK_DEFAULTS` 하드코딩 → React Context
- `LangCtx` → React Context with TypeScript generic

**의존성:**
```json
{
  "react": "^18", "react-dom": "^18", "react-router-dom": "^6",
  "typescript": "^5", "vite": "^5", "@vitejs/plugin-react": "^4",
  "axios": "^1.7"
}
```
(Chart 컴포넌트는 디자인 원본의 SVG 기반 커스텀 구현 그대로 사용 — Recharts 등 외부 라이브러리 불필요)

---

## 디자인 시스템 (iLive DS)

| 토큰 | 값 |
|------|-----|
| Primary font | Pretendard Variable |
| Mono font | Roboto Mono |
| Brand blue | #2993D1 |
| Brand navy | #214290 |
| App accent (기본) | #2563EB |
| Light BG | #F8FAFC |
| Dark BG | #0F1013 |
| Border | #E5E7EB |
| Radius (기본) | 8px |

테마: 라이트/다크 모드 모두 구현. `data-theme` attribute로 전환.

---

## 구현 순서

### Phase 1 — 백엔드 기반 (expert-backend)
1. `backend/` 디렉토리 + FastAPI 앱 생성
2. SQLAlchemy 모델 + SQLite 데이터베이스 설정
3. `requirements.txt` 작성 (standard-rag 버전 기준)
4. 시드 데이터: MODELS, SERVICES, CONVERSATIONS, PROVIDERS를 DB에 초기화
5. 모든 API 엔드포인트 구현 (초기에는 시드 데이터 반환)
6. CORS + `/api/v1` prefix

### Phase 2 — LLM 연결 (expert-backend)
1. `services/llm_gateway.py` — OpenAI + Anthropic 실제 연결
2. SSE 스트리밍 (`POST /api/v1/conversations/{id}/messages`)
3. `services/usage_tracker.py` — 토큰/비용 미들웨어
4. Dashboard API — 집계 쿼리 구현

### Phase 3 — RAG 파이프라인 (expert-backend)
standard-rag 스펙 참고, `backend/pipeline/` 신규 작성:
- parser → chunker → embedder → vectorstore → retriever → reranker → generator
- `services/rag_service.py` — `rag: true` 서비스에 자동 적용

### Phase 4 — 프론트엔드 (expert-frontend)
1. Vite React TypeScript 프로젝트 초기화
2. 디자인 시스템 CSS 통합 (Pretendard 폰트 포함)
3. JSX → TSX 전환: primitives, chrome, charts, data
4. 페이지별 전환: Chat → Services → Dashboard → Marketplace → Playground
5. API 클라이언트 (`src/lib/api.ts`) + SSE 스트리밍 유틸

### Phase 5 — 통합 검증
1. 프론트엔드 → 백엔드 실제 연결 확인
2. SSE 채팅 스트리밍 엔드투엔드 테스트
3. 라이트/다크 모드 전환 확인
4. KR/EN 언어 전환 확인

---

## refsource에서 참고할 스펙 (복사 금지)

| 참고 파일 | 참고 항목 |
|-----------|----------|
| `pipeline/parser.py` | unstructured/PyMuPDF 파싱 방식 |
| `pipeline/retriever.py` | RRF 계산식, BM25 + vector 병합 |
| `pipeline/embedder.py` | sentence-transformers lazy-load 패턴 |
| `api/query.py` | SSE EventSourceResponse 구조 |
| `config/settings.py` | pydantic-settings 필드 목록 |
| `requirements.txt` | 의존성 버전 범위 |

---

## 검증 방법

```bash
# 백엔드 실행
cd backend && pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → http://localhost:8000/docs (OpenAPI 확인)

# 프론트엔드 실행
cd frontend && npm install && npm run dev
# → http://localhost:5173 (UI 확인)
```

**체크리스트:**
- [ ] 5개 페이지 정상 렌더링
- [ ] Chat SSE 스트리밍 동작
- [ ] Dashboard KPI/차트 실데이터 표시
- [ ] Services CRUD (생성/수정/삭제/즐겨찾기)
- [ ] Marketplace 필터/검색/페이지네이션
- [ ] Playground 파라미터 조정 + 실행
- [ ] 라이트/다크 모드 전환
- [ ] KR/EN 언어 전환
- [ ] 사이드바 접기/펼치기

---

## 범위 외 (이번 구현에 제외)

- Google/Mistral/Cohere/Meta 실제 LLM 연결 (목 응답)
- 이미지 생성 (Stable Diffusion, DALL·E) 실행
- 음성 변환 (Whisper) 실행
- OAuth/인증 시스템
- Docker Compose 배포 설정
- PGVector 프로덕션 환경
