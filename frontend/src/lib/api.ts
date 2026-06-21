import axios from 'axios';
import type { Service, ServiceStatus, Conversation, ChatMessage, Citation } from '../types';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({ baseURL: `${BASE}/api/v1` });

// Models
export const getModels = (params?: Record<string, unknown>) => api.get('/models', { params });
export const getModel = (id: string) => api.get(`/models/${id}`);

// Services
export const getServices = (params?: Record<string, unknown>) => api.get('/services', { params });
export const createService = (data: unknown) => api.post('/services', data);
export const updateService = (id: string, data: unknown) => api.put(`/services/${id}`, data);
export const deleteService = (id: string) => api.delete(`/services/${id}`);
export const toggleFavorite = (id: string) => api.patch(`/services/${id}/favorite`);

// Conversations
export const getConversations = () => api.get('/conversations');
export const createConversation = (data?: unknown) => api.post('/conversations', data || {});
export const getMessages = (id: string) => api.get(`/conversations/${id}/messages`);

// Usage
export const getKPIs = () => api.get('/usage/kpis');
export const getDailyCost = (range = '30d') => api.get('/usage/daily-cost', { params: { range } });
export const getDailyTokens = (range = '30d') => api.get('/usage/daily-tokens', { params: { range } });
export const getLatencyTrend = (range = '30d') => api.get('/usage/latency-trend', { params: { range } });
export const getProviderBreakdown = () => api.get('/usage/provider-breakdown');
export const getModelBreakdown = () => api.get('/usage/model-breakdown');
export const getTopServices = () => api.get('/usage/top-services');

// API Keys
export const getApiKeys = () => api.get('/api-keys');
export const createApiKey = (name: string) => api.post('/api-keys', { name });
export const deleteApiKey = (id: string) => api.delete(`/api-keys/${id}`);

// Ingest (RAG)
export const listDocs = (serviceId: string) => api.get(`/ingest/${serviceId}/docs`);
export const deleteDoc = (serviceId: string, docId: string) => api.delete(`/ingest/${serviceId}/docs/${docId}`);
export function uploadDoc(serviceId: string, file: File): Promise<unknown> {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/ingest/${serviceId}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

// Mappers
const GROUP_EN: Record<string, string> = {
  '오늘': 'Today', '어제': 'Yesterday',
  '지난 7일': 'Last 7 days', '지난 30일': 'Last 30 days',
};

export function mapService(s: Record<string, unknown>): Service {
  return {
    id: s.id as string,
    name: s.name as string,
    nameEn: s.name_en as string,
    model: s.model_id as string,
    provider: s.provider as string,
    rag: s.rag_enabled as boolean,
    status: s.status as ServiceStatus,
    created: new Date(s.created_at as string).toISOString().slice(0, 10),
    fav: s.favorite as boolean,
    reqs: s.requests_30d as string,
    latency: s.avg_latency as string,
  };
}

export function mapConversation(c: Record<string, unknown>): Conversation {
  const group = (c.group as string) || '오늘';
  return {
    id: c.id as string,
    title: c.title as string,
    titleEn: c.title_en as string,
    time: group,
    timeEn: GROUP_EN[group] || group,
  };
}

export function mapMessage(m: Record<string, unknown>): ChatMessage {
  const cites: Citation[] = ((m.citations as string[]) || []).map((src, i) => ({
    n: i + 1, src, loc: '',
  }));
  return {
    role: m.role as 'user' | 'assistant',
    text: m.content as string,
    cites: cites.length ? cites : undefined,
  };
}

export interface PlaygroundCfg {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  system?: string;
  [key: string]: unknown;
}

export async function* streamPlayground(
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  config: PlaygroundCfg
): AsyncGenerator<{ type: string; delta?: string }> {
  const res = await fetch(`${BASE}/api/v1/playground/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_id: modelId,
      messages,
      system_prompt: config.system || '',
      temperature: config.temperature ?? 0.7,
      max_tokens: config.max_tokens ?? 1024,
      top_p: config.top_p ?? 1.0,
    }),
  });
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === 'content') parsed.type = 'delta';
          yield parsed;
        } catch { /* ignore */ }
      }
    }
  }
}
