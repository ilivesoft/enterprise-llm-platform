import { useState, useRef } from 'react';
import { Icon } from '../components/primitives/Icon';
import { LogoTile } from '../components/primitives/LogoTile';
import { Switch } from '../components/primitives/Switch';
import { Badge } from '../components/primitives/Badge';
import { useLang } from '../contexts/LangContext';
import { useToast } from '../contexts/ToastContext';
import { MODELS } from '../data';
import { streamPlayground } from '../lib/api';
import type { PlaygroundCfg } from '../lib/api';
import type { Model, PlaygroundConfig, FunctionDef, ChatMessage } from '../types';

function ConfigSlider({ label, value, min, max, step, onChange, hint }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</span>
        <span className="t-mono" style={{ fontSize: 12.5, color: 'var(--accent)', fontWeight: 600 }}>{value}</span>
      </div>
      <input type="range" className="rng" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
      {hint && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

export function Playground() {
  const lang = useLang();
  const { showToast } = useToast();
  const textModels = MODELS.filter(m => m.cat === 'text');
  const [showCode, setShowCode] = useState(false);
  const [model, setModel] = useState<Model>(textModels[0]);
  const [cfg, setCfg] = useState<PlaygroundConfig>({ temperature: 0.7, top_p: 1, top_k: 40, max_tokens: 2048, rep: 1.1 });
  const [sys, setSys] = useState('당신은 정확하고 간결하게 답변하는 엔터프라이즈 어시스턴트입니다.');
  const [deep, setDeep] = useState(false);
  const [fnOn, setFnOn] = useState(true);
  const set = (k: keyof PlaygroundConfig, v: number) => setCfg(c => ({ ...c, [k]: v }));
  const [funcs, setFuncs] = useState<FunctionDef[]>([
    { name: 'search_knowledge_base', on: true, params: 'query: string' },
    { name: 'get_account_status', on: true, params: 'account_id: string' },
    { name: 'create_ticket', on: false, params: 'title, priority' },
  ]);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [pgInput, setPgInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function runPlayground() {
    const text = pgInput.trim();
    if (!text || thinking) return;
    const userMsg: ChatMessage = { role: 'user', text };
    setMsgs(m => [...m, userMsg]);
    setPgInput('');
    setThinking(true);
    let assistant = '';
    const history = [...msgs, userMsg].map(m => ({ role: m.role, content: m.text || '' }));
    try {
      const pgCfg: PlaygroundCfg = { temperature: cfg.temperature, top_p: cfg.top_p, max_tokens: cfg.max_tokens, system: sys };
      for await (const chunk of streamPlayground(model.id, history, pgCfg)) {
        if (chunk.type === 'delta' && chunk.delta) {
          assistant += chunk.delta;
          setMsgs(m => {
            const last = m[m.length - 1];
            if (last?.role === 'assistant') return [...m.slice(0, -1), { ...last, text: assistant }];
            return [...m, { role: 'assistant', text: assistant }];
          });
        }
      }
    } catch {
      if (!assistant) {
        setMsgs(m => [...m, { role: 'assistant', text: lang === 'en' ? 'An error occurred.' : '오류가 발생했습니다.' }]);
        showToast(lang === 'en' ? 'Playground request failed.' : '플레이그라운드 요청에 실패했습니다.', 'error');
      }
    } finally {
      setThinking(false);
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }

  const codeSnippet = `import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="${model.id}",
    max_tokens=${cfg.max_tokens},
    temperature=${cfg.temperature},
    system="${sys.replace(/"/g, '\\"')}",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.content[0].text)`;

  return (
    <>
    {showCode && (
      <>
        <div onClick={() => setShowCode(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100 }} />
        <div className="card" style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: 600, zIndex: 101, padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{lang === 'en' ? 'API code snippet' : 'API 코드 스니펫'}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                navigator.clipboard.writeText(codeSnippet).catch(() => {});
                showToast(lang === 'en' ? 'Copied to clipboard.' : '클립보드에 복사됐습니다.', 'success');
              }}>
                <Icon name="content_copy" size={15} /> {lang === 'en' ? 'Copy' : '복사'}
              </button>
              <button className="icon-btn" onClick={() => setShowCode(false)}><Icon name="close" size={20} /></button>
            </div>
          </div>
          <pre style={{
            margin: 0, padding: '20px', overflowX: 'auto',
            background: 'var(--surface-2)', fontSize: 12.5, lineHeight: 1.7,
            color: 'var(--text)', fontFamily: 'var(--ap-mono)',
          }}>{codeSnippet}</pre>
        </div>
      </>
    )}
    <div className="view-in" style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      {/* left: model selector */}
      <div style={{ width: 250, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-rail)', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '16px 16px 10px' }}>
          <div className="t-label">{lang === 'en' ? 'Model' : '모델'}</div>
        </div>
        <div className="scroll-y" style={{ flex: 1, padding: '0 10px 14px' }}>
          {textModels.map(m => {
            const active = model.id === m.id;
            return (
              <button key={m.id} onClick={() => setModel(m)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 10px',
                border: '1px solid', borderColor: active ? 'var(--accent)' : 'transparent',
                background: active ? 'var(--accent-soft)' : 'transparent',
                borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginBottom: 4,
              }}>
                <LogoTile provider={m.provider} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.provider} · {m.ctx}</div>
                </div>
                {active && <Icon name="check_circle" size={17} fill style={{ color: 'var(--accent)' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* center: chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <LogoTile provider={model.provider} size={24} radius="6px" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{model.name}</span>
            <Badge variant="neutral">{lang === 'en' ? 'Playground' : '플레이그라운드'}</Badge>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setMsgs([]); setPgInput(''); }}><Icon name="restart_alt" size={16} /> {lang === 'en' ? 'Reset' : '초기화'}</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCode(s => !s)}><Icon name="code" size={16} /> {lang === 'en' ? 'View code' : '코드 보기'}</button>
            <button className="btn btn-primary btn-sm"><Icon name="rocket_launch" size={16} /> {lang === 'en' ? 'Deploy' : '배포'}</button>
          </div>
        </div>

        <div ref={scrollRef} className="scroll-y" style={{ flex: 1, padding: 24 }}>
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card card-pad" style={{ borderStyle: 'dashed', background: 'var(--surface-2)' }}>
              <div className="t-label" style={{ marginBottom: 4 }}>{lang === 'en' ? 'System' : '시스템'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>{sys}</div>
            </div>
            {msgs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 40 }}>
                {lang === 'en' ? 'Enter a test prompt below to start.' : '아래에 테스트 프롬프트를 입력하세요.'}
              </div>
            )}
            {msgs.map((m, i) => m.role === 'user' ? (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ maxWidth: '82%', background: 'var(--accent-soft)', padding: '11px 15px', borderRadius: '14px 14px 4px 14px', fontSize: 14, lineHeight: 1.6 }}>
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <LogoTile provider={model.provider} size={30} radius="50%" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{model.name}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.62 }}>{m.text}</div>
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', gap: 12 }}>
                <LogoTile provider={model.provider} size={30} radius="50%" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30 }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--muted)', animation: `livepulse 1s ${d * 0.18}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: '0 24px 18px' }}>
          <div className="card" style={{ maxWidth: 680, margin: '0 auto', padding: 10, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <textarea
              className="field"
              rows={1}
              value={pgInput}
              onChange={e => setPgInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runPlayground(); } }}
              placeholder={lang === 'en' ? 'Enter a test prompt…' : '테스트 프롬프트를 입력하세요…'}
              style={{ border: 'none', boxShadow: 'none', background: 'transparent', padding: '6px', flex: 1 }}
            />
            <button className="btn btn-primary" style={{ width: 40, padding: 0 }} onClick={runPlayground} disabled={!pgInput.trim() || thinking}>
              <Icon name="play_arrow" size={20} fill />
            </button>
          </div>
        </div>
      </div>

      {/* right: configuration */}
      <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--bg-rail)', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 18px', borderBottom: '1px solid var(--border)' }}>
          <Icon name="tune" size={18} style={{ color: 'var(--muted)', marginRight: 8 }} />
          <span style={{ fontSize: 14, fontWeight: 700 }}>{lang === 'en' ? 'Configuration' : '구성'}</span>
        </div>
        <div className="scroll-y" style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 7 }}>{lang === 'en' ? 'System prompt' : '시스템 프롬프트'}</div>
            <textarea className="field" rows={3} value={sys} onChange={e => setSys(e.target.value)} style={{ fontSize: 12.5, lineHeight: 1.5 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <ConfigSlider label="Temperature" value={cfg.temperature} min={0} max={2} step={0.1} onChange={v => set('temperature', v)}
              hint={lang === 'en' ? 'Higher = more creative, lower = more focused.' : '높을수록 창의적, 낮을수록 일관적입니다.'} />
            <ConfigSlider label="Top P" value={cfg.top_p} min={0} max={1} step={0.05} onChange={v => set('top_p', v)} />
            <ConfigSlider label="Top K" value={cfg.top_k} min={0} max={100} step={1} onChange={v => set('top_k', v)} />
            <ConfigSlider label="Max tokens" value={cfg.max_tokens} min={256} max={8192} step={256} onChange={v => set('max_tokens', v)} />
            <ConfigSlider label={lang === 'en' ? 'Repetition penalty' : '반복 패널티'} value={cfg.rep} min={1} max={2} step={0.05} onChange={v => set('rep', v)} />
          </div>

          <hr className="hr" />

          {/* deep thinking */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Icon name="neurology" size={19} style={{ color: deep ? 'var(--accent)' : 'var(--muted)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'en' ? 'Deep thinking' : '딥 씽킹'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{lang === 'en' ? 'Extended reasoning' : '확장 추론 모드'}</div>
              </div>
            </div>
            <Switch checked={deep} onChange={setDeep} />
          </div>

          <hr className="hr" />

          {/* function calling */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Icon name="function" size={19} style={{ color: fnOn ? 'var(--accent)' : 'var(--muted)' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'en' ? 'Function calling' : '함수 호출'}</span>
              </div>
              <Switch checked={fnOn} onChange={setFnOn} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, opacity: fnOn ? 1 : 0.45, pointerEvents: fnOn ? 'auto' : 'none' }}>
              {funcs.map((f, i) => (
                <div key={f.name} className="card" style={{ padding: '10px 12px', boxShadow: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <code className="t-mono" style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{f.name}</code>
                    <Switch checked={f.on} onChange={v => setFuncs(fs => fs.map((x, j) => j === i ? { ...x, on: v } : x))} />
                  </div>
                  <div className="t-mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>({f.params})</div>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: 2 }}>
                <Icon name="add" size={16} /> {lang === 'en' ? 'Add function' : '함수 추가'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
