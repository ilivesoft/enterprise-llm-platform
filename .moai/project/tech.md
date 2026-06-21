# 기술 스택 및 설계 결정 — 엔터프라이즈 LLM 운영 플랫폼

---

## 기술 스택 표

### 백엔드 계층 (Backend Stack)

| 계층 | 기술 | 버전 | 목적 |
|------|------|------|------|
| **런타임** | Python | 3.13+ | 비동기 I/O, 풍부한 ML 라이브러리 |
| **웹 프레임워크** | FastAPI | 0.115+ | 타입 힌팅, 자동 API 문서(OpenAPI), 높은 성능 |
| **ASGI 서버** | Uvicorn | 0.30+ | FastAPI용 비동기 HTTP 서버 |
| **ORM** | SQLAlchemy | 2.0+ | 비동기 쿼리, 타입 안전성 |
| **설정 관리** | pydantic-settings | 2.3+ | 환경변수 및 설정 파일 관리 |
| **HTTP 클라이언트** | httpx | 0.27+ | 비동기 HTTP, OpenAI/Anthropic API 호출 |
| **LLM SDK** | openai, anthropic | 최신 | OpenAI GPT-4o, Anthropic Claude API |
| **텍스트 임베딩** | sentence-transformers | 3.0+ | BAAI/bge-m3 모델, 다국어 지원 |
| **벡터 DB** | chromadb | 0.5+ | 벡터 저장소, 검색 인덱싱 |
| **텍스트 임베딩 추론** | torch | 2.3+ | sentence-transformers의 의존성 |
| **하이브리드 검색** | rank-bm25 | 0.2+ | BM25 기반 희소 검색 알고리즘 |
| **PDF 파싱** | pymupdf (fitz) | 1.24+ | PDF 텍스트 추출 |
| **Word 파싱** | python-docx | 0.8+ | DOCX 문서 파싱 |
| **SSE 응답** | sse-starlette | 1.8+ | 스트리밍 응답 (Server-Sent Events) |
| **데이터 검증** | pydantic | 2.7+ | 요청/응답 스키마 검증 |
| **환경 관리** | python-dotenv | 1.0+ | .env 파일 로딩 (개발 환경) |
| **로깅** | Python logging | 내장 | 구조화된 로그 |
| **테스트** | pytest | 8.0+ | 단위/통합 테스트 |

### 프론트엔드 계층 (Frontend Stack)

| 계층 | 기술 | 버전 | 목적 |
|------|------|------|------|
| **런타임** | Node.js | 20+ | JavaScript 실행 환경 |
| **언어** | TypeScript | 5.9+ | 타입 안전성, IDE 지원 |
| **프레임워크** | React | 19.x | 컴포넌트 기반 UI |
| **라우팅** | react-router-dom | 7.x | SPA 클라이언트 라우팅 |
| **HTTP 클라이언트** | axios | 1.7.x | RESTful API 호출 |
| **빌드 도구** | Vite | 8.x | 빠른 개발 서버, 번들링 |
| **스타일링** | CSS Modules / Tailwind | - | 컴포넌트 스타일 |
| **상태 관리** | React Context | - | 전역 상태 (테마, 언어, 토스트) |
| **차트/그래프** | recharts 또는 chart.js | - | 사용량, 비용 시각화 |
| **번들 검사** | vite-plugin-visualizer | - | 번들 크기 최적화 |
| **린팅** | ESLint | 10+ | 코드 스타일, 오류 검출 |
| **포매팅** | Prettier | 3.x | 자동 코드 포매팅 |
| **테스트** | Vitest + React Testing Library | - | 단위 테스트, 컴포넌트 테스트 |

### 데이터베이스 계층 (Database Stack)

| 계층 | 기술 | 버전 | 목적 |
|------|------|------|------|
| **관계형 DB** | SQLite (개발) | 3.45+ | 경량, 파일 기반, 개발 편의성 |
| **관계형 DB (프로덕션)** | PostgreSQL | 15+ | 프로덕션급 확장성, JSONB 지원 |
| **벡터 DB** | ChromaDB | 0.5+ | 벡터 임베딩 저장 및 검색 |
| **캐싱 (선택)** | Redis | 7.x+ | 세션, 율 제한 캐싱 (향후) |

### 외부 API 및 서비스

| 서비스 | 버전 | 목적 |
|--------|------|------|
| **OpenAI API** | GPT-4o, GPT-4 Turbo | LLM 추론 |
| **Anthropic API** | Claude 3, Claude 3.5 | LLM 추론 |
| **Mock LLM Provider** | 내부 구현 | 테스트, 개발 |

---

## 프레임워크 선택 근거

### FastAPI 선택

**결정**: Python 백엔드 → FastAPI

**근거**:
1. **자동 타입 검증**: Pydantic 통합으로 요청/응답 자동 검증 (보안 +)
2. **비동기 네이티브**: `async/await` 지원으로 I/O 대기 시간 최소화 (LLM API, 벡터DB 호출 대기)
3. **자동 OpenAPI 문서**: `/docs` 엔드포인트에서 자동 생성 (개발 효율성 +)
4. **높은 성능**: uvicorn + 비동기 처리로 초당 100,000+ 요청 처리 가능
5. **ML 생태계**: Python 기반이므로 PyTorch, sentence-transformers 직접 통합

**대안 검토**:
- Django: 동기 기반, 오버헤드 많음 (채택 안 함)
- Starlette: 낮은 수준 API, FastAPI보다 덜 편함 (채택 안 함)
- Go (Gin): 타입 안전하나 ML 라이브러리 부족 (채택 안 함)

---

### React 선택

**결정**: 프론트엔드 → React 19 + TypeScript

**근거**:
1. **컴포넌트 재사용성**: 대화 인터페이스, 서비스 카드, 차트 등을 여러 페이지에서 재사용
2. **상태 관리 단순화**: React Context로 테마(light/dark), 언어(한국어/영어), 알림 상태 관리
3. **SSE 통합**: `fetch('...', { signal: AbortController })`로 스트리밍 응답 처리
4. **TypeScript 지원**: 프롱트엔드 타입 안전성 (IDE 자동완성, 런타임 오류 감소)
5. **성숙한 생태계**: react-router-dom (라우팅), axios (HTTP), recharts (차트)

**대안 검토**:
- Vue: 배우기 쉬우나 기업 채용 시장에서 덜 인기 (채택 안 함)
- Svelte: 작은 번들이나 리소스 부족 (채택 안 함)
- Angular: 복잡한 설정, 학습 곡선 높음 (채택 안 함)

---

### SQLAlchemy 2.0 선택

**결정**: ORM → SQLAlchemy 2.0

**근거**:
1. **비동기 지원**: SQLAlchemy 2.0은 비동기 엔진 지원 (FastAPI와 완벽 조화)
2. **데이터베이스 독립성**: SQLite → PostgreSQL 마이그레이션 시 코드 변경 최소 (설정만 변경)
3. **타입 힌팅**: Python 타입 힌팅 지원으로 IDE 자동완성
4. **복잡한 쿼리**: ORM이 어려우면 직접 SQL 작성 가능 (`text("SELECT ...").bindparams(...)`)

---

### ChromaDB 선택

**결정**: 벡터 DB → ChromaDB

**근거**:
1. **로컬 배포**: 별도 서버 없이 파일 기반 벡터DB 운영 (비용 절감)
2. **빠른 프로토타입**: 초기 개발에 설정 최소화
3. **서비스별 컬렉션**: 같은 DB에서 여러 서비스의 문서를 격리 (멀티테넌트 안전성)
4. **메타데이터 필터링**: 쿼리 시 서비스 ID로 문서 필터링 (SQL 없이 벡터 필터링)

**향후 확장성**:
- Pinecone 또는 Weaviate로 마이그레이션 가능 (backend/storage 인터페이스만 변경)

---

### BAAI/bge-m3 임베딩 모델 선택

**결정**: 텍스트 임베딩 → sentence-transformers의 BAAI/bge-m3

**근거**:
1. **다국어 지원**: 한국어, 일본어, 중국어, 영어 임베딩 (기업 전역 지원)
2. **높은 품질**: 학문적 벤치마크에서 최고 수준 성능 (MTEB 리더보드)
3. **하이브리드 검색**: 동일 모델이 밀집 및 희소(BM25) 검색에 모두 사용 가능
4. **로컬 실행**: API 호출 불필요, GPU/CPU에서 로컬 추론 (비용 절감, 지연시간 감소)

**성능**:
- 임베딩 차원: 384D (bge-small) 또는 768D (bge-base)
- 문서 청킹 후 임베딩 시간: 500개 문서 ~30초 (GPU)
- 메모리 사용: ~1GB (모델 로딩)

---

## 핵심 설계 결정

### 설계 결정 1: 비동기 우선 (Async-First Architecture)

**문제**: LLM API 호출, 벡터DB 검색, DB 쿼리 등이 I/O 대기 시간을 유발하여 처리량 저하

**해결책**: 
```python
# backend/api/v1/messages.py (비동기)
@router.post("/")
async def create_message(req: MessageRequest):
    # 모두 비동기로 병렬 처리
    conversation = await db.get_conversation(req.conversation_id)
    search_results = await rag_service.search(req.query)  # DB 대기 중 다른 요청 처리
    response = await llm_gateway.generate(prompt)  # LLM API 대기 중 다른 요청 처리
    await db.save_message(response)  # 저장 중 다른 요청 처리
    return response
```

**효과**: 100개 요청 동시 처리 시 동기 처리는 100배 느림, 비동기는 거의 같은 속도

---

### 설계 결정 2: 다중 제공자 추상화 (Multi-Provider Abstraction)

**문제**: OpenAI, Anthropic 등 각 제공자의 API 형식, 가격 책정, 모델명이 다름

**해결책**: 
```python
# backend/services/llm_gateway.py
class LLMGateway:
    async def generate(self, prompt, model_id, streaming=False):
        model = await service_registry.get_model(model_id)
        provider = self._get_provider(model.provider)  # 제공자별 프로바이더 선택
        response = await provider.generate(prompt, model.api_model_name)
        usage = extract_usage(response)  # 제공자별 파싱
        await usage_tracker.record(usage)  # 통일된 사용량 기록
        return response

class OpenAIProvider:
    async def generate(self, prompt, model_name):
        return await self.client.chat.completions.create(
            model=model_name, messages=[{"role": "user", "content": prompt}]
        )

class AnthropicProvider:
    async def generate(self, prompt, model_name):
        return await self.client.messages.create(
            model=model_name, messages=[{"role": "user", "content": prompt}]
        )
```

**혜택**: 
- 새로운 LLM 제공자 추가 시 `AnthropicProvider` 추가 (기존 코드 변경 없음)
- 모델 비용 변경 시 데이터베이스만 업데이트 (코드 수정 불필요)

---

### 설계 결정 3: 서비스 범위 벡터 스토어 (Service-Scoped VectorStore)

**문제**: 여러 팀이 같은 플랫폼에서 RAG를 사용할 때, 한 팀의 문서가 다른 팀의 검색에 섞여 나타남 (데이터 유출)

**해결책**: ChromaDB에서 서비스별 컬렉션 분리
```python
# backend/services/rag_service.py
async def ingest_document(service_id, document):
    # 각 서비스마다 독립적인 벡터 컬렉션
    collection_name = f"service_{service_id}"
    collection = chroma_client.get_or_create_collection(collection_name)
    
    chunks = await parser.parse(document)
    embeddings = await embedder.embed_batch(chunks)
    collection.add(embeddings=embeddings, documents=chunks)

async def search(service_id, query):
    collection_name = f"service_{service_id}"
    collection = chroma_client.get_collection(collection_name)
    # 이 서비스의 문서에서만 검색
    results = collection.query(query_embeddings=embed(query), n_results=5)
    return results
```

**혜택**: 데이터 격리, 검색 성능 향상 (불필요한 문서 제외)

---

### 설계 결정 4: 하이브리드 검색 (Hybrid Search: Dense + BM25)

**문제**: 
- 밀집 벡터 검색: 의미적 유사성 우수, 정확한 용어 검색 약함
- BM25 검색: 정확한 용어 검색 우수, 의미적 유사성 약함

**해결책**: 둘 다 실행 후 결합
```python
# backend/pipeline/retriever.py
async def search(query, collection):
    # 1. 밀집 벡터 검색 (의미 기반)
    query_embedding = await embedder.embed(query)
    dense_results = collection.query(
        query_embeddings=[query_embedding],
        n_results=20
    )
    
    # 2. BM25 검색 (정확도 기반)
    bm25_results = bm25_index.get_top_k(query, k=20)
    
    # 3. 결합 (reciprocal rank fusion)
    combined = merge_results(dense_results, bm25_results)
    
    # 4. 재순위 지정 (CrossEncoder)
    reranked = await reranker.rerank(query, combined, top_k=5)
    return reranked
```

**효과**: 정확도 향상 (밀집만 사용 대비 +15-20%)

---

### 설계 결정 5: 스트리밍 응답 (Streaming Response with SSE)

**문제**: 사용자가 LLM 응답을 받을 때까지 기다려야 함 (UX 저하)

**해결책**: Server-Sent Events로 토큰 하나씩 전송
```python
# backend/api/v1/messages.py
@router.post("/", response_class=StreamingResponse)
async def create_message(req: MessageRequest):
    async def event_generator():
        async for chunk in llm_gateway.generate_stream(req.query):
            yield f"data: {chunk.json()}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")

# frontend/src/pages/ChatWorkspace.tsx
async function sendMessage(query) {
    const response = await fetch('/messages/', { method: 'POST' });
    const reader = response.body.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = JSON.parse(value);
        setMessages(prev => [...prev, chunk.token]);  // 토큰 하나씩 표시
    }
}
```

**효과**: 지연시간 인식 감소 (5초 대기 vs 첫 토큰 0.5초 + 계속 텍스트 나타남)

---

### 설계 결정 6: 다국어 지원 (Internationalization)

**문제**: 한국, 일본, 중국 팀 모두 플랫폼을 사용하나 UI 언어가 고정됨

**해결책**: 
```python
# backend/config/settings.py (설정)
SUPPORTED_LANGUAGES = ["ko", "en", "ja", "zh"]
DEFAULT_LANGUAGE = "ko"

# frontend/src/contexts/LangContext.tsx (전역 상태)
const LangContext = React.createContext();
export function LangProvider({ children }) {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'ko');
    const i18n = {
        ko: { messages: "메시지", services: "서비스" },
        en: { messages: "Messages", services: "Services" }
    };
    return (
        <LangContext.Provider value={{ lang, setLang, t: i18n[lang] }}>
            {children}
        </LangContext.Provider>
    );
}
```

**효과**: 한 번의 배포로 4개 언어 지원, 사용자 지역 자동 감지 가능

---

## 개발 환경 요구사항

### 최소 요구사항

| 구성 | 요구사항 |
|------|---------|
| **OS** | Windows 11, macOS 12+, Ubuntu 22.04+ |
| **Python** | 3.13+ (pip 및 venv 포함) |
| **Node.js** | 20.x LTS 이상 (npm 포함) |
| **RAM** | 최소 8GB (개발 편의성 위해 16GB 권장) |
| **디스크** | 10GB 여유 공간 (의존성 + 벡터DB) |
| **인터넷** | OpenAI, Anthropic API 호출용 |

### 개발 도구

| 도구 | 목적 |
|------|------|
| **Git** | 버전 관리 |
| **VS Code** 또는 **PyCharm** | IDE (Python, JavaScript 지원) |
| **Postman** 또는 **Bruno** | API 테스트 |
| **Docker** (선택) | 컨테이너화 배포 |

---

## 빌드 및 실행 명령어

### 백엔드 실행

#### 1단계: Python 환경 설정
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

#### 2단계: 환경변수 설정
```bash
# backend/.env 생성
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=sqlite:///./app.db
CHROMA_DB_PATH=./storage/chroma
```

#### 3단계: 데이터베이스 초기화 (선택)
```bash
python -c "from db.init import init_db; init_db()"
```

#### 4단계: 서버 실행
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**출력**:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**API 문서**: http://localhost:8000/docs (Swagger UI)

---

### 프론트엔드 실행

#### 1단계: Node.js 의존성 설치
```bash
cd frontend
npm install
```

#### 2단계: 개발 서버 실행
```bash
npm run dev
```

**출력**:
```
VITE v8.x.x  ready in 123 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

#### 3단계: 브라우저에서 접속
```
http://localhost:5173
```

**자동 리로드**: 코드 변경 시 브라우저가 자동 새로고침

---

### 프로덕션 빌드

#### 백엔드
```bash
# 최적화된 이미지 빌드 (Docker)
docker build -t enterprise-llm-backend:1.0 .
docker run -p 8000:8000 enterprise-llm-backend:1.0
```

#### 프론트엔드
```bash
cd frontend
npm run build   # dist/ 디렉토리에 최적화된 번들 생성
npm run preview  # 프로덕션 빌드 로컬 테스트
```

**번들 분석**:
```bash
npm run build:analyze  # 번들 크기 시각화
```

---

## 설정 개요 (Configuration)

### 백엔드 설정 (backend/config/settings.py)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 기본 설정
    APP_NAME: str = "Enterprise LLM Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # 데이터베이스
    DATABASE_URL: str = "sqlite:///./app.db"  # 또는 postgresql://user:pass@localhost/db
    
    # 벡터 DB
    CHROMA_DB_PATH: str = "./storage/chroma"
    
    # LLM 제공자 API 키
    OPENAI_API_KEY: str  # 환경변수에서 로드
    ANTHROPIC_API_KEY: str
    
    # LLM 모델 설정
    DEFAULT_MODEL: str = "gpt-4o"
    AVAILABLE_MODELS: list = ["gpt-4o", "claude-3-sonnet"]
    
    # RAG 설정
    RAG_CHUNK_SIZE: int = 1000  # 텍스트 청크 크기 (문자)
    RAG_CHUNK_OVERLAP: int = 100  # 청크 간 중복 (문자)
    RAG_TOP_K: int = 5  # 검색 결과 상위 K개
    
    # API 설정
    API_TITLE: str = "Enterprise LLM API"
    API_VERSION: str = "v1"
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()
```

### 프론트엔드 설정 (.env)

```
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Enterprise LLM Platform
VITE_DEFAULT_LANGUAGE=ko
```

### 환경변수 관리

```bash
# 개발 환경
export OPENAI_API_KEY=sk-dev-...
export ANTHROPIC_API_KEY=sk-ant-dev-...
export DATABASE_URL=sqlite:///./dev.db

# 프로덕션 환경
export OPENAI_API_KEY=sk-prod-...
export ANTHROPIC_API_KEY=sk-ant-prod-...
export DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/llm_platform
```

---

## 성능 및 확장성

### 현재 성능 특성 (SQLite + 단일 서버)

| 메트릭 | 값 |
|--------|-----|
| **동시 연결** | ~100 (Uvicorn 기본) |
| **처리량** | ~1,000 req/s (간단한 요청) |
| **평균 응답 시간** | 500ms (LLM API 호출) |
| **RAG 검색 시간** | ~200ms (500개 문서) |
| **메모리 사용** | ~500MB (베이스) + 100MB/추가 서비스 |

### 확장 계획

**Phase 1 (현재)**: SQLite + 단일 인스턴스
- 작은 팀 (~50명)
- 월 데이터 ~1GB

**Phase 2 (3-6개월)**: PostgreSQL + 로드 밸런서
- 중규모 팀 (~500명)
- 월 데이터 ~50GB

**Phase 3 (6-12개월)**: 분산 벡터DB (Pinecone/Weaviate) + Kubernetes
- 대규모 팀 (~5,000명)
- 월 데이터 ~500GB+

---

## 보안 고려사항

### API 키 보호

```python
# backend/schemas/api_key.py
class ApiKeyCreate(BaseModel):
    name: str
    expires_in_days: int = 90  # 90일 후 만료

# 저장 시 해싱
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_key = pwd_context.hash(api_key)

# 검증 시
is_valid = pwd_context.verify(provided_key, hashed_key)
```

### 환경변수 보호

```bash
# .env 파일은 .gitignore에 포함
echo ".env" >> .gitignore
```

### HTTPS 강제 (프로덕션)

```python
# backend/main.py
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
app.add_middleware(HTTPSRedirectMiddleware)
```

---

## 의존성 버전 정책

### Python 패키지 업데이트

```bash
# 마이너 버전 업데이트 확인
pip list --outdated

# 안전한 업데이트
pip install --upgrade fastapi uvicorn  # 명시적으로 필요한 패키지만

# requirements.txt 재생성
pip freeze > requirements.txt
```

### Node.js 패키지 업데이트

```bash
# 취약점 확인
npm audit

# 취약점 자동 수정
npm audit fix

# 버전 정책 (보수적)
# package.json에서 ^X.Y.Z는 마이너 버전까지 업데이트 허용
# ~X.Y.Z는 패치 버전만 업데이트 허용
```

---

## 모니터링 및 로깅 (향후)

### 로깅 설정 예시

```python
# backend/config/logging.py
import logging
import logging.config

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default"
        },
        "file": {
            "class": "logging.FileHandler",
            "filename": "app.log",
            "formatter": "default"
        }
    },
    "loggers": {
        "backend": {
            "handlers": ["console", "file"],
            "level": "INFO"
        }
    }
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)
```

### 메트릭 수집 (향후 Prometheus)

```python
# backend/middleware/metrics.py
from prometheus_client import Counter, Histogram
import time

request_count = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def add_metrics(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    
    request_count.labels(method=request.method, endpoint=request.url.path).inc()
    request_duration.observe(duration)
    
    return response
```
