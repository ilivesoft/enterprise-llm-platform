// @MX:ANCHOR: [AUTO] SSE 스트리밍 핵심 함수 — ChatWorkspace와 Playground에서 참조
// @MX:REASON: fan_in >= 2, 비동기 스트림 생성기 패턴

export async function* streamChat(
  conversationId: string,
  content: string,
  modelId: string
): AsyncGenerator<{ type: string; delta?: string; usage?: unknown }> {
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const res = await fetch(`${BASE}/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, model_id: modelId }),
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
          // 백엔드가 type: "content"로 반환 — type: "delta"로 정규화
          if (parsed.type === 'content') parsed.type = 'delta';
          yield parsed;
        } catch {
          // 잘못된 JSON 무시
        }
      }
    }
  }
}
