// =============================================================
// 시드 데이터 (data.jsx → TypeScript 변환)
// =============================================================
import type {
  Provider, Category, Model, StatusConfig, Service,
  Conversation, ChatMessage, PromptLibraryItem, Kpi,
  ProviderBreakdown, ModelBreakdown, TopService, NavItem,
} from '../types';

export const PROVIDERS: Record<string, Provider> = {
  OpenAI:      { initial: 'O',  color: '#10A37F' },
  Anthropic:   { initial: 'A',  color: '#D97757' },
  Meta:        { initial: 'M',  color: '#0866FF' },
  Mistral:     { initial: 'M',  color: '#FF7000' },
  Google:      { initial: 'G',  color: '#4285F4' },
  Cohere:      { initial: 'C',  color: '#39594D' },
  Stability:   { initial: 'S',  color: '#6A3CE0' },
  ElevenLabs:  { initial: 'E',  color: '#111827' },
  BAAI:        { initial: 'B',  color: '#0EA5E9' },
  Upstage:     { initial: 'U',  color: '#7C3AED' },
  Microsoft:   { initial: 'M',  color: '#2563EB' },
};

export const CATEGORIES: Category[] = [
  { id: 'all',    kr: '전체',          en: 'All',              icon: 'apps' },
  { id: 'text',   kr: '텍스트 생성',    en: 'Text Generation',  icon: 'edit_note' },
  { id: 'embed',  kr: '임베딩',        en: 'Embedding',        icon: 'scatter_plot' },
  { id: 'image',  kr: '이미지 생성',    en: 'Image Generation', icon: 'image' },
  { id: 'speech', kr: '음성',          en: 'Speech',           icon: 'graphic_eq' },
  { id: 'rerank', kr: '리랭커',        en: 'Reranker',         icon: 'sort' },
  { id: 'ocr',    kr: 'OCR',          en: 'OCR',              icon: 'document_scanner' },
];

export const MODELS: Model[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', version: '2024-11', params: '—', cat: 'text',
    tags: ['Chat', 'Vision', 'Function calling', '128K ctx'], updated: '2일 전', updatedEn: '2 days ago', featured: true, ctx: '128K' },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'OpenAI', version: '2024-07', params: '—', cat: 'text',
    tags: ['Chat', 'Vision', 'Low cost'], updated: '1주 전', updatedEn: '1 week ago', ctx: '128K' },
  { id: 'claude-37', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', version: '20250219', params: '—', cat: 'text',
    tags: ['Chat', 'Reasoning', 'Vision', '200K ctx'], updated: '4일 전', updatedEn: '4 days ago', featured: true, ctx: '200K' },
  { id: 'claude-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', version: '20241022', params: '—', cat: 'text',
    tags: ['Chat', 'Fast', 'Low cost'], updated: '3주 전', updatedEn: '3 weeks ago', ctx: '200K' },
  { id: 'llama-31-70b', name: 'Llama 3.1 70B Instruct', provider: 'Meta', version: '3.1', params: '70B', cat: 'text',
    tags: ['Chat', 'Open weights', 'Self-host'], updated: '1개월 전', updatedEn: '1 month ago', ctx: '128K' },
  { id: 'mistral-large', name: 'Mistral Large 2', provider: 'Mistral', version: '2407', params: '123B', cat: 'text',
    tags: ['Chat', 'Function calling', 'Multilingual'], updated: '2주 전', updatedEn: '2 weeks ago', ctx: '128K' },
  { id: 'gemini-15-pro', name: 'Gemini 1.5 Pro', provider: 'Google', version: '002', params: '—', cat: 'text',
    tags: ['Chat', 'Vision', '2M ctx'], updated: '5일 전', updatedEn: '5 days ago', ctx: '2M' },
  { id: 'command-r-plus', name: 'Command R+', provider: 'Cohere', version: '08-2024', params: '104B', cat: 'text',
    tags: ['RAG', 'Tool use', 'Multilingual'], updated: '3주 전', updatedEn: '3 weeks ago', ctx: '128K' },
  { id: 'text-embed-3-lg', name: 'text-embedding-3-large', provider: 'OpenAI', version: 'v3', params: '—', cat: 'embed',
    tags: ['3072 dim', 'Retrieval'], updated: '1개월 전', updatedEn: '1 month ago', ctx: '8K' },
  { id: 'cohere-embed-v3', name: 'Embed v3 Multilingual', provider: 'Cohere', version: 'v3', params: '—', cat: 'embed',
    tags: ['1024 dim', '100+ langs'], updated: '2개월 전', updatedEn: '2 months ago', ctx: '512' },
  { id: 'bge-m3', name: 'BGE-M3', provider: 'BAAI', version: 'm3', params: '568M', cat: 'embed',
    tags: ['Open weights', 'Dense + sparse'], updated: '1개월 전', updatedEn: '1 month ago', ctx: '8K' },
  { id: 'sd-35-large', name: 'Stable Diffusion 3.5 Large', provider: 'Stability', version: '3.5', params: '8.1B', cat: 'image',
    tags: ['Text-to-image', 'Open weights'], updated: '2주 전', updatedEn: '2 weeks ago', ctx: '—' },
  { id: 'dalle-3', name: 'DALL·E 3', provider: 'OpenAI', version: '3', params: '—', cat: 'image',
    tags: ['Text-to-image', 'HD'], updated: '1개월 전', updatedEn: '1 month ago', ctx: '—' },
  { id: 'whisper-v3', name: 'Whisper large-v3', provider: 'OpenAI', version: 'v3', params: '1.55B', cat: 'speech',
    tags: ['Transcription', '99 langs', 'Open weights'], updated: '1개월 전', updatedEn: '1 month ago', ctx: '—' },
  { id: 'eleven-v2', name: 'Multilingual v2', provider: 'ElevenLabs', version: 'v2', params: '—', cat: 'speech',
    tags: ['Text-to-speech', '29 langs'], updated: '3주 전', updatedEn: '3 weeks ago', ctx: '—' },
  { id: 'bge-rerank', name: 'bge-reranker-v2-m3', provider: 'BAAI', version: 'v2-m3', params: '568M', cat: 'rerank',
    tags: ['Cross-encoder', 'Open weights'], updated: '1개월 전', updatedEn: '1 month ago', ctx: '8K' },
  { id: 'cohere-rerank', name: 'Rerank 3', provider: 'Cohere', version: '3', params: '—', cat: 'rerank',
    tags: ['Relevance', '100+ langs'], updated: '2개월 전', updatedEn: '2 months ago', ctx: '4K' },
  { id: 'upstage-ocr', name: 'Document Parse OCR', provider: 'Upstage', version: '1.1', params: '—', cat: 'ocr',
    tags: ['Layout', 'Tables', 'KR + EN'], updated: '2주 전', updatedEn: '2 weeks ago', ctx: '—' },
];

export const STATUS: Record<string, StatusConfig> = {
  running:  { kr: '실행 중', en: 'Running',  cls: 'badge-success', dot: 'var(--success)' },
  stopped:  { kr: '중지됨',  en: 'Stopped',  cls: 'badge-neutral', dot: 'var(--muted)' },
  training: { kr: '학습 중', en: 'Training', cls: 'badge-accent',  dot: 'var(--accent)' },
  building: { kr: '빌드 중', en: 'Building', cls: 'badge-warning', dot: 'var(--warning)' },
  error:    { kr: '오류',    en: 'Error',    cls: 'badge-error',   dot: 'var(--error)' },
};

export const SERVICES: Service[] = [
  { id: 's1', name: '고객지원 어시스턴트', nameEn: 'Customer Support Assistant', model: 'Claude 3.7 Sonnet', provider: 'Anthropic', rag: true, status: 'running', created: '2025-03-12', fav: true, reqs: '1.2M', latency: '740ms' },
  { id: 's2', name: '사내 지식 검색', nameEn: 'Internal Knowledge Search', model: 'GPT-4o', provider: 'OpenAI', rag: true, status: 'running', created: '2025-02-28', fav: true, reqs: '842K', latency: '910ms' },
  { id: 's3', name: '계약서 분석 파이프라인', nameEn: 'Contract Analysis Pipeline', model: 'Mistral Large 2', provider: 'Mistral', rag: true, status: 'training', created: '2025-04-02', fav: false, reqs: '64K', latency: '1.4s' },
  { id: 's4', name: '마케팅 카피 생성기', nameEn: 'Marketing Copy Generator', model: 'GPT-4o mini', provider: 'OpenAI', rag: false, status: 'running', created: '2025-01-19', fav: false, reqs: '410K', latency: '520ms' },
  { id: 's5', name: '음성 회의록 작성', nameEn: 'Meeting Transcriber', model: 'Whisper large-v3', provider: 'OpenAI', rag: false, status: 'stopped', created: '2024-12-05', fav: false, reqs: '88K', latency: '—' },
  { id: 's6', name: '제품 이미지 생성', nameEn: 'Product Image Studio', model: 'Stable Diffusion 3.5', provider: 'Stability', rag: false, status: 'building', created: '2025-04-18', fav: false, reqs: '12K', latency: '3.1s' },
  { id: 's7', name: '재무 리포트 Q&A', nameEn: 'Financial Report Q&A', model: 'Gemini 1.5 Pro', provider: 'Google', rag: true, status: 'running', created: '2025-03-30', fav: true, reqs: '203K', latency: '1.1s' },
  { id: 's8', name: '코드 리뷰 봇', nameEn: 'Code Review Bot', model: 'Llama 3.1 70B', provider: 'Meta', rag: true, status: 'error', created: '2025-02-11', fav: false, reqs: '156K', latency: '—' },
  { id: 's9', name: '다국어 번역 게이트웨이', nameEn: 'Translation Gateway', model: 'Command R+', provider: 'Cohere', rag: false, status: 'running', created: '2025-04-09', fav: false, reqs: '521K', latency: '680ms' },
];

export const CONVERSATIONS: Conversation[] = [
  { id: 'c1', title: '4분기 매출 분석 요약', titleEn: 'Q4 revenue analysis', time: '오늘', timeEn: 'Today', active: true },
  { id: 'c2', title: 'RAG 파이프라인 설계 검토', titleEn: 'RAG pipeline review', time: '오늘', timeEn: 'Today' },
  { id: 'c3', title: '고객 이탈 원인 가설', titleEn: 'Churn hypotheses', time: '어제', timeEn: 'Yesterday' },
  { id: 'c4', title: '온보딩 이메일 카피 작성', titleEn: 'Onboarding email copy', time: '어제', timeEn: 'Yesterday' },
  { id: 'c5', title: 'GDPR 컴플라이언스 체크리스트', titleEn: 'GDPR checklist', time: '지난 7일', timeEn: 'Last 7 days' },
  { id: 'c6', title: '경쟁사 기능 비교표', titleEn: 'Competitor feature matrix', time: '지난 7일', timeEn: 'Last 7 days' },
  { id: 'c7', title: '제품 설명 번역 (KR→EN)', titleEn: 'Product copy translation', time: '지난 30일', timeEn: 'Last 30 days' },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { role: 'user', text: '첨부한 4분기 실적 보고서를 핵심만 3가지로 요약하고, 전 분기 대비 가장 큰 변화를 알려줘.' },
  { role: 'assistant',
    text: '4분기 실적 보고서의 핵심을 세 가지로 정리했습니다.\n\n**1. 매출 성장 가속** — 총매출은 $23.8M로 전 분기 대비 18% 증가했습니다. 신규 엔터프라이즈 계약 7건이 성장의 절반 이상을 견인했습니다.\n\n**2. 마진 개선** — 총이익률이 64%에서 68%로 4%p 개선되었습니다. 인프라 비용 최적화가 주요 요인입니다.\n\n**3. 순유지율(NRR) 상승** — NRR이 112%에서 121%로 상승하며 기존 고객 확장이 견조했습니다.\n\n전 분기 대비 가장 큰 변화는 **엔터프라이즈 세그먼트의 비중**으로, 전체 매출에서 차지하는 비율이 31%에서 44%로 크게 늘었습니다.',
    cites: [
      { n: 1, src: 'Q4_2025_실적보고서.pdf', loc: 'p.4 · 매출 요약' },
      { n: 2, src: 'Q4_2025_실적보고서.pdf', loc: 'p.11 · 수익성 지표' },
      { n: 3, src: 'finance_dashboard_export.xlsx', loc: 'NRR 시트' },
    ] },
];

export const PROMPT_LIBRARY: PromptLibraryItem[] = [
  { kr: '요약', en: 'Summarize', icon: 'summarize', desc: '문서를 핵심 3가지로 요약' },
  { kr: '번역', en: 'Translate', icon: 'translate', desc: '한국어 ↔ 영어 번역' },
  { kr: '표로 정리', en: 'Tabulate', icon: 'table_chart', desc: '내용을 비교표로 변환' },
  { kr: '코드 리뷰', en: 'Code review', icon: 'code', desc: '버그·개선점 점검' },
  { kr: '톤 다듬기', en: 'Refine tone', icon: 'auto_fix_high', desc: '격식 있는 톤으로 교정' },
];

export const KPIS: Kpi[] = [
  { id: 'cost',    kr: '총 비용',     en: 'Total cost',     value: '$48,210', delta: '+12.4%', up: true,  sub: '이번 달', subEn: 'This month' },
  { id: 'tokens',  kr: '총 토큰',     en: 'Total tokens',   value: '1.84B',   delta: '+8.1%',  up: true,  sub: '이번 달', subEn: 'This month' },
  { id: 'latency', kr: '평균 지연시간', en: 'Avg latency',    value: '812ms',   delta: '-6.3%',  up: false, good: true, sub: 'p50', subEn: 'p50' },
  { id: 'success', kr: '성공률',      en: 'Success rate',   value: '99.82%',  delta: '+0.04%', up: true,  sub: '30일',   subEn: '30 days' },
];

export const DAILY_COST: number[] = [980,1040,1120,1010,1180,1320,1260,1190,1280,1410,1380,1450,1520,1490,1380,1440,1560,1610,1580,1670,1720,1690,1780,1840,1810,1760,1890,1950,1920,2010];
export const DAILY_TOKENS: number[] = [42,48,51,46,55,62,58,53,57,66,63,68,71,69,64,67,73,76,74,79,82,80,85,89,86,83,91,94,92,97];
export const LATENCY_TREND: number[] = [920,905,890,910,880,860,845,870,840,825,830,810,820,800,815,795,808,790,800,785,795,780,790,775,788,770,782,765,778,760];

export const PROVIDER_BREAKDOWN: ProviderBreakdown[] = [
  { name: 'OpenAI', pct: 38, value: '$18,320', color: '#10A37F' },
  { name: 'Anthropic', pct: 29, value: '$13,980', color: '#D97757' },
  { name: 'Google', pct: 14, value: '$6,750', color: '#4285F4' },
  { name: 'Mistral', pct: 9, value: '$4,340', color: '#FF7000' },
  { name: 'Cohere', pct: 6, value: '$2,890', color: '#39594D' },
  { name: '기타', nameEn: 'Other', pct: 4, value: '$1,930', color: '#94A3B8' },
];

export const MODEL_BREAKDOWN: ModelBreakdown[] = [
  { name: 'GPT-4o', pct: 100, value: '$14,210' },
  { name: 'Claude 3.7 Sonnet', pct: 82, value: '$11,640' },
  { name: 'Gemini 1.5 Pro', pct: 47, value: '$6,750' },
  { name: 'GPT-4o mini', pct: 31, value: '$4,410' },
  { name: 'Mistral Large 2', pct: 24, value: '$3,420' },
  { name: 'Command R+', pct: 17, value: '$2,380' },
];

export const TOP_SERVICES: TopService[] = [
  { name: '고객지원 어시스턴트', nameEn: 'Customer Support Assistant', reqs: '1.2M', cost: '$9,840', trend: 'up' },
  { name: '사내 지식 검색', nameEn: 'Internal Knowledge Search', reqs: '842K', cost: '$7,120', trend: 'up' },
  { name: '다국어 번역 게이트웨이', nameEn: 'Translation Gateway', reqs: '521K', cost: '$3,260', trend: 'down' },
  { name: '마케팅 카피 생성기', nameEn: 'Marketing Copy Generator', reqs: '410K', cost: '$2,180', trend: 'up' },
  { name: '재무 리포트 Q&A', nameEn: 'Financial Report Q&A', reqs: '203K', cost: '$1,940', trend: 'flat' },
];

export const NAV: NavItem[] = [
  { id: 'chat',      kr: '채팅 워크스페이스', en: 'Chat Workspace',    icon: 'forum' },
  { id: 'services',  kr: 'AI 서비스',        en: 'AI Services',       icon: 'lan' },
  { id: 'dashboard', kr: '비용 · 사용량',     en: 'Cost & Usage',      icon: 'monitoring' },
];

export const NAV_SECONDARY: NavItem[] = [
  { id: 'marketplace', kr: '모델 마켓플레이스', en: 'Model Marketplace', icon: 'grid_view' },
  { id: 'playground',  kr: '플레이그라운드',    en: 'Playground',        icon: 'science' },
];
