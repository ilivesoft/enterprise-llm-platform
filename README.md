# Enterprise LLM Platform (엔터프라이즈 LLM 플랫폼)

LLM 운영 플랫폼으로 모델 마켓플레이스, 다중 LLM 서비스 통합, 문서 기반 RAG, 실시간 사용량 모니터링을 제공합니다.

---

## 주요 기능

- **모델 마켓플레이스**: OpenAI, Anthropic, Google Vertex AI 등 다양한 LLM 모델 통합 관리
- **서비스 연동**: 여러 LLM 서비스를 하나의 대시보드에서 관리 (상태, 즐겨찾기, RAG 활성화 여부)
- **RAG 파이프라인**: 문서 업로드 → 파싱 → 청킹 → 임베딩 → 검색 → 순위 재정렬 → 응답 생성
- **대화 관리**: 대화 세션별 메시지 저장 및 인용문(citation) 추적
- **사용량 모니터링**: 토큰 소비량, 비용, 지연시간 추적 대시보드
- **API 키 관리**: 안전한 API 키 저장 및 접근 제어
- **모델 테스트**: 실시간 플레이그라운드에서 다양한 모델 비교 테스트
- **다국어 지원**: 한국어, 영어 등 다국어 UI
- **테마 지원**: 라이트/다크 모드

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **백엔드** | FastAPI 0.115+, Python 3.11, Uvicorn, SQLAlchemy 2.0 ORM |
| **데이터베이스** | SQLite (aiosqlite), 비동기 지원 |
| **RAG 엔진** | sentence-transformers (BAAI/bge-m3), ChromaDB, rank-bm25, pymupdf, python-docx |
| **LLM 통합** | OpenAI SDK, Anthropic SDK, Google Vertex AI |
| **스트리밍** | sse-starlette (Server-Sent Events) |
| **프론트엔드** | React 19, TypeScript 6, Vite 8, React Router 7 |
| **UI 라이브러리** | Tailwind CSS, Recharts (차트 라이브러리) |
| **API 클라이언트** | Axios |
| **폰트** | Pretendard Variable |
| **인프라** | Docker, Elasticsearch Stack |
| **개발도구** | VS Code debugpy, pytest, ruff linter |

---

## 프로젝트 구조

```
enterprise-llm-platform/
├── backend/                          # FastAPI 백엔드
│   ├── main.py                       # 앱 진입점 (포트 8000)
│   ├── api/
│   │   └── v1/
│   │       ├── models/               # LLM 모델 관리 (모델명, 버전, 컨텍스트 윈도우)
│   │       ├── services/             # LLM 서비스 통합 (모델 연결, RAG 설정)
│   │       ├── conversations/        # 대화 세션 관리
│   │       ├── messages/             # 메시지 저장 (role, content, citation)
│   │       ├── usage/                # 사용량 모니터링 (토큰, 비용, 지연시간)
│   │       ├── playground/           # 모델 테스트 플레이그라운드
│   │       ├── api_keys/             # API 키 관리
│   │       └── ingest/               # 문서 인제스트 (RAG 파이프라인)
│   ├── db/
│   │   └── models.py                 # ORM 모델 (Model, Service, Conversation, Message, UsageRecord, ApiKey)
│   ├── pipeline/                     # RAG 파이프라인
│   │   ├── parser.py                 # PDF/DOCX 파싱
│   │   ├── chunker.py                # 텍스트 청킹
│   │   ├── embedder.py               # 임베딩 생성 (sentence-transformers 또는 OpenAI)
│   │   ├── vectorstore.py            # ChromaDB 벡터스토어
│   │   ├── retriever.py              # 벡터 검색
│   │   ├── reranker.py               # rank-bm25 순위 재정렬
│   │   └── generator.py              # LLM 응답 생성
│   └── storage/
│       ├── chroma_db/                # 벡터 데이터베이스
│       └── uploads/                  # 업로드된 문서 저장소
├── frontend/                         # React 프론트엔드
│   ├── src/
│   │   ├── pages/                    # 페이지 컴포넌트
│   │   │   ├── Dashboard.tsx         # 대시보드 (차트)
│   │   │   ├── Marketplace.tsx       # 모델 마켓플레이스
│   │   │   ├── Services.tsx          # 서비스 관리
│   │   │   ├── ChatWorkspace.tsx     # AI 채팅 워크스페이스
│   │   │   ├── Playground.tsx        # 모델 플레이그라운드
│   │   │   ├── ApiKeys.tsx           # API 키 관리
│   │   │   └── Settings.tsx          # 설정
│   │   ├── lib/
│   │   │   └── sse.ts               # Server-Sent Events 클라이언트
│   │   ├── context/
│   │   │   ├── LangContext.tsx       # 다국어 지원
│   │   │   ├── ThemeContext.tsx      # 라이트/다크 테마
│   │   │   └── ToastContext.tsx      # 알림 토스트
│   │   └── App.tsx                   # 메인 앱 컴포넌트
│   └── vite.config.ts                # Vite 설정
├── docker/
│   └── elasticsearch-stack/          # Elasticsearch 스택 (선택사항)
└── .vscode/
    └── launch.json                   # VS Code 디버깅 설정

```

---

## 시작하기

### 사전 준비

- Python 3.11+
- Node.js 20+
- npm 또는 yarn
- pip (Python 패키지 관리자)

### 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# Python 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정 (.env 파일)
# OPENAI_API_KEY, ANTHROPIC_API_KEY 등 필요한 API 키 설정
```

### 프론트엔드 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 환경변수 설정 (.env 파일)
# VITE_API_URL=http://localhost:8000/api/v1
```

### 앱 실행

**백엔드 실행**:
```bash
cd backend
python main.py
# 또는
uvicorn main:app --reload --port 8000
```

백엔드는 `http://localhost:8000`에서 실행되고, API 엔드포인트는 `/api/v1` 프리픽스를 사용합니다.

**프론트엔드 실행** (다른 터미널):
```bash
cd frontend
npm run dev
```

프론트엔드는 `http://localhost:5173`에서 실행됩니다.

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/v1/models` | 전체 LLM 모델 목록 조회 |
| POST | `/api/v1/models` | 새 모델 등록 |
| GET | `/api/v1/models/{model_id}` | 특정 모델 상세 조회 |
| PUT | `/api/v1/models/{model_id}` | 모델 정보 수정 |
| DELETE | `/api/v1/models/{model_id}` | 모델 삭제 |
| GET | `/api/v1/services` | 전체 LLM 서비스 목록 |
| POST | `/api/v1/services` | 새 서비스 생성 |
| PUT | `/api/v1/services/{service_id}` | 서비스 설정 수정 (RAG, 상태 등) |
| POST | `/api/v1/conversations` | 새 대화 세션 생성 |
| GET | `/api/v1/conversations/{conversation_id}` | 대화 이력 조회 |
| POST | `/api/v1/messages` | 메시지 전송 (스트리밍 응답) |
| GET | `/api/v1/usage` | 사용량 통계 조회 |
| POST | `/api/v1/api_keys` | API 키 생성 |
| DELETE | `/api/v1/api_keys/{key_id}` | API 키 삭제 |
| POST | `/api/v1/ingest/upload` | 문서 업로드 및 RAG 파이프라인 시작 |
| POST | `/api/v1/playground/test` | 모델 테스트 (플레이그라운드) |

---

## RAG 파이프라인

문서 기반 검색 증강 생성(RAG) 파이프라인으로 최신 정보를 활용한 응답 생성을 지원합니다.

**파이프라인 단계**:

1. **파싱 (parser.py)**: PDF, DOCX 등 다양한 형식의 문서를 텍스트로 변환
2. **청킹 (chunker.py)**: 긴 텍스트를 의미 있는 크기의 청크로 분할
3. **임베딩 (embedder.py)**: BAAI/bge-m3 또는 OpenAI 모델로 텍스트를 벡터로 변환
4. **벡터스토어 (vectorstore.py)**: ChromaDB에 임베딩 저장
5. **검색 (retriever.py)**: 사용자 질문과 유사한 문서 검색
6. **순위 재정렬 (reranker.py)**: rank-bm25 알고리즘으로 검색 결과 순위 재정렬
7. **생성 (generator.py)**: LLM이 재정렬된 문서를 참고하여 최종 응답 생성

**사용 예**:
```bash
# 문서 업로드
curl -X POST http://localhost:8000/api/v1/ingest/upload \
  -F "file=@document.pdf"

# RAG 활성화 메시지 전송
curl -X POST http://localhost:8000/api/v1/messages \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "conv-123",
    "service_id": "service-456",
    "content": "업로드한 문서에서 핵심 내용은?",
    "use_rag": true
  }'
```

---

## 개발 환경

### VS Code 디버깅 설정

VS Code의 디버깅 기능을 통해 백엔드와 프론트엔드를 동시에 디버깅할 수 있습니다.

**설정 파일**: `.vscode/launch.json`

**디버깅 구성**:

1. **FastAPI 백엔드**: Python debugpy를 사용한 백엔드 디버깅
   - 포트: 5678
   - 자동 재로드 활성화
   - 중단점 설정 가능

2. **React 프론트엔드**: Chrome/Edge 브라우저 디버깅
   - 포트: 5173
   - DevTools 통합

3. **Full Stack (Compound)**: 백엔드와 프론트엔드를 동시에 디버깅
   - 한 번의 시작으로 양쪽 모두 디버깅 세션 시작

**디버깅 시작**:

1. VS Code의 디버그 탭에서 "Full Stack (Compound)" 선택
2. F5 또는 `Debug > Start Debugging` 클릭
3. 백엔드 코드에 중단점(Breakpoint) 설정
4. 프론트엔드 개발자 도구(DevTools)에서 소스 코드 디버깅

---

## 환경 변수

`.env` 파일에서 다음 변수 설정:

**백엔드** (`backend/.env`):
```env
# LLM API 키
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_VERTEX_API_KEY=...

# 데이터베이스
DATABASE_URL=sqlite:///./app.db

# RAG 설정
EMBEDDING_MODEL=BAAI/bge-m3
CHROMA_DB_PATH=./storage/chroma_db
UPLOAD_DIR=./storage/uploads
```

**프론트엔드** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_NAME=Enterprise LLM Platform
```

---

## 기여 및 라이선스

기여는 환영합니다. 자세한 사항은 CONTRIBUTING.md를 참고하세요.

---

## 문의

문제 발생 시 GitHub Issues 탭에서 이슈를 생성하거나 이메일로 연락주세요.
