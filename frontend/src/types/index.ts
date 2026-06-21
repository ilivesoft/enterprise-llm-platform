// =============================================================
// 전체 TypeScript 타입 정의
// =============================================================

export type Lang = 'kr' | 'en';

export type Theme = 'light' | 'dark';

export type Density = 'comfortable' | 'compact';

export type AccentKey = 'blue' | 'ilive' | 'navy' | 'violet' | 'teal';

export type CardStyle = 'detailed' | 'compact' | 'logo';

export interface TweakSettings {
  theme: Theme;
  accent: AccentKey;
  density: Density;
  cardStyle: CardStyle;
}

export interface Provider {
  initial: string;
  color: string;
}

export type ModelCategory = 'all' | 'text' | 'embed' | 'image' | 'speech' | 'rerank' | 'ocr';

export interface Category {
  id: ModelCategory;
  kr: string;
  en: string;
  icon: string;
}

export interface Model {
  id: string;
  name: string;
  provider: string;
  version: string;
  params: string;
  cat: ModelCategory;
  tags: string[];
  updated: string;
  updatedEn: string;
  featured?: boolean;
  ctx: string;
}

export type ServiceStatus = 'running' | 'stopped' | 'training' | 'building' | 'error';

export interface StatusConfig {
  kr: string;
  en: string;
  cls: string;
  dot: string;
}

export interface Service {
  id: string;
  name: string;
  nameEn: string;
  model: string;
  provider: string;
  rag: boolean;
  status: ServiceStatus;
  created: string;
  fav: boolean;
  reqs: string;
  latency: string;
}

export interface Conversation {
  id: string;
  title: string;
  titleEn: string;
  time: string;
  timeEn: string;
  active?: boolean;
}

export interface Citation {
  n: number;
  src: string;
  loc: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text?: string;
  cites?: Citation[];
}

export interface PromptLibraryItem {
  kr: string;
  en: string;
  icon: string;
  desc: string;
}

export interface Kpi {
  id: string;
  kr: string;
  en: string;
  value: string;
  delta: string;
  up: boolean;
  good?: boolean;
  sub: string;
  subEn: string;
}

export interface ProviderBreakdown {
  name: string;
  nameEn?: string;
  pct: number;
  value: string;
  color: string;
}

export interface ModelBreakdown {
  name: string;
  pct: number;
  value: string;
}

export interface TopService {
  name: string;
  nameEn: string;
  reqs: string;
  cost: string;
  trend: 'up' | 'down' | 'flat';
}

export interface NavItem {
  id: string;
  kr: string;
  en: string;
  icon: string;
}

export interface PlaygroundConfig {
  temperature: number;
  top_p: number;
  top_k: number;
  max_tokens: number;
  rep: number;
}

export interface FunctionDef {
  name: string;
  on: boolean;
  params: string;
}

export interface AttachedFile {
  name: string;
  size: string;
}

export interface AccentColors {
  accent: string;
  press: string;
  soft: string;
  ring: string;
}
