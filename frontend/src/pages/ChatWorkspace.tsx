import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '../components/primitives/Icon';
import { LogoTile } from '../components/primitives/LogoTile';
import { Empty } from '../components/primitives/Empty';
import { useLang, L } from '../contexts/LangContext';
import { MODELS, PROMPT_LIBRARY } from '../data';
import { getConversations, getMessages, createConversation, mapConversation, mapMessage } from '../lib/api';
import { streamChat } from '../lib/sse';
import { useToast } from '../contexts/ToastContext';
import type { ChatMessage, Model, AttachedFile, Conversation } from '../types';

// 인라인 마크다운 렌더러: **bold**, [n] 인용 마커
function renderRich(text: string, onCite?: (n: number) => void): ReactNode[] {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    if (line.trim() === '') return <div key={li} style={{ height: 8 }} />;
    const parts: ReactNode[] = [];
    const regex = /\*\*(.+?)\*\*|\[(\d+)\]/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let key = 0;
    while ((m = regex.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      if (m[1] != null) {
        parts.push(<strong key={'b' + li + key++} style={{ fontWeight: 700, color: 'var(--text)' }}>{m[1]}</strong>);
      } else if (m[2] != null) {
        const n = +m[2];
        parts.push(
          <button key={'c' + li + key++} onClick={() => onCite && onCite(n)}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 16, height: 16, padding: '0 3px', margin: '0 2px',
              fontSize: 10.5, fontWeight: 700, verticalAlign: 'top',
              borderRadius: 4, border: 'none', cursor: 'pointer',
              background: 'var(--accent-soft)', color: 'var(--accent)',
            }}>{n}</button>
        );
      }
      last = regex.lastIndex;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <p key={li} style={{ margin: '0 0 4px', lineHeight: 1.62 }}>{parts}</p>;
  });
}

function ConvList({ lang, convList, activeId, onSelect, onNew }: {
  lang: string;
  convList: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  const groups: Record<string, Conversation[]> = {};
  convList.forEach(c => {
    const g = L({ kr: c.time, en: c.timeEn }, lang as 'kr' | 'en');
    if (!groups[g]) groups[g] = [];
    groups[g].push(c);
  });

  return (
    <div style={{
      width: 264, flexShrink: 0, borderRight: '1px solid var(--border)',
      background: 'var(--bg-rail)', display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{ padding: 14 }}>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onNew}>
          <Icon name="edit_square" size={17} /> {lang === 'en' ? 'New chat' : '새 대화'}
        </button>
        <div className="search-wrap" style={{ marginTop: 10 }}>
          <Icon name="search" />
          <input
            className="field"
            placeholder={lang === 'en' ? 'Search chats' : '대화 검색'}
            style={{ height: 34, background: 'var(--surface-2)', borderColor: 'transparent' }}
          />
        </div>
      </div>
      <div className="scroll-y" style={{ flex: 1, padding: '0 10px 14px' }}>
        {Object.entries(groups).map(([g, items]) => (
          <div key={g} style={{ marginBottom: 10 }}>
            <div className="t-label" style={{ padding: '8px 8px 4px' }}>{g}</div>
            {items.map(c => {
              const isActive = c.id === activeId;
              return (
                <button key={c.id} onClick={() => onSelect(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '0 10px', height: 38, border: 'none', cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--surface-2)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-sec)',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Icon name="chat_bubble" size={15} fill={isActive} style={{ color: isActive ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {L({ kr: c.title, en: c.titleEn }, lang as 'kr' | 'en')}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelPickerInline({ model, onPick }: { model: Model; onPick: (m: Model) => void }) {
  const [open, setOpen] = useState(false);
  const choices = MODELS.filter(m => m.cat === 'text').slice(0, 6);

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn btn-ghost" onClick={() => setOpen(o => !o)} style={{ height: 36, fontWeight: 600 }}>
        <LogoTile provider={model.provider} size={20} radius="5px" />
        {model.name}
        <Icon name="expand_more" size={18} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div className="card" style={{ position: 'absolute', top: 42, left: 0, width: 320, zIndex: 41, padding: 6, boxShadow: 'var(--shadow-lg)' }}>
            {choices.map(m => (
              <button key={m.id} onClick={() => { onPick(m); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '8px 10px', border: 'none',
                  background: model.id === m.id ? 'var(--surface-2)' : 'transparent',
                  borderRadius: 8, cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = model.id === m.id ? 'var(--surface-2)' : 'transparent'}
              >
                <LogoTile provider={m.provider} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{m.provider} · {m.ctx} ctx</div>
                </div>
                {model.id === m.id && <Icon name="check" size={18} style={{ color: 'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function ChatWorkspace() {
  const lang = useLang();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [model, setModel] = useState<Model>(MODELS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [convList, setConvList] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showCites, setShowCites] = useState(true);
  const [activeCite, setActiveCite] = useState<number | null>(null);
  const [thinking, setThinking] = useState(false);
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [showLib, setShowLib] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const allCites = messages.flatMap(m => m.cites || []);

  useEffect(() => {
    const convParam = searchParams.get('conv');
    getConversations().then(r => {
      const convs: Conversation[] = r.data.map(mapConversation);
      setConvList(convs);
      if (convParam && convs.some(c => c.id === convParam)) {
        setActiveConvId(convParam);
      } else if (convParam) {
        // conv from Services: not in list yet — add it and select
        setConvList(cs => [{ id: convParam, title: '새 대화', titleEn: 'New chat', time: '오늘', timeEn: 'Today' }, ...cs]);
        setActiveConvId(convParam);
      } else if (convs.length > 0) {
        setActiveConvId(convs[0].id);
      }
      // clear the ?conv= param after handling
      if (convParam) setSearchParams({}, { replace: true });
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeConvId) return;
    getMessages(activeConvId).then(r => {
      setMessages(r.data.map(mapMessage));
    }).catch(() => {});
  }, [activeConvId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, thinking]);

  async function newConv() {
    try {
      const r = await createConversation();
      const conv = mapConversation(r.data);
      setConvList(cs => [conv, ...cs]);
      setActiveConvId(r.data.id);
      setMessages([]);
    } catch {}
  }

  async function send() {
    const text = input.trim();
    if (!text || !activeConvId) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setThinking(true);
    let assistant = '';
    try {
      for await (const chunk of streamChat(activeConvId, text, model.id)) {
        if (chunk.type === 'delta' && chunk.delta) {
          assistant += chunk.delta;
          setMessages(m => {
            const last = m[m.length - 1];
            if (last?.role === 'assistant') {
              return [...m.slice(0, -1), { ...last, text: assistant }];
            }
            return [...m, { role: 'assistant', text: assistant }];
          });
        }
      }
    } catch {
      if (!assistant) {
        setMessages(m => [...m, { role: 'assistant', text: lang === 'en' ? 'An error occurred.' : '오류가 발생했습니다.' }]);
        showToast(lang === 'en' ? 'Failed to get response.' : '응답을 받지 못했습니다.', 'error');
      }
    } finally {
      setThinking(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function grow(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
    setInput(e.target.value);
  }

  function jumpCite(n: number) {
    setShowCites(true);
    setActiveCite(n);
    setTimeout(() => setActiveCite(null), 1800);
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <ConvList lang={lang} convList={convList} activeId={activeConvId} onSelect={setActiveConvId} onNew={newConv} />

      {/* center thread */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <div style={{
          height: 56, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 18px', borderBottom: '1px solid var(--border)',
        }}>
          <ModelPickerInline model={model} onPick={setModel} />
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" style={{ height: 32 }}>
              <Icon name="ios_share" size={16} /> {lang === 'en' ? 'Share' : '공유'}
            </button>
            <button
              className="icon-btn"
              onClick={() => setShowCites(s => !s)}
              title="Citations"
              style={{ background: showCites ? 'var(--accent-soft)' : 'transparent', color: showCites ? 'var(--accent)' : 'var(--icon)' }}
            >
              <Icon name="menu_book" size={20} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="scroll-y" style={{ flex: 1, padding: '24px 0' }}>
          <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>
            {messages.map((msg, i) => msg.role === 'user' ? (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '84%', background: 'var(--accent-soft)', color: 'var(--text)',
                  padding: '11px 15px', borderRadius: '14px 14px 4px 14px', fontSize: 14, lineHeight: 1.6,
                }}>
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <LogoTile provider={model.provider} size={30} radius="50%" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>{model.name}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>{msg.text && renderRich(msg.text, jumpCite)}</div>
                  {msg.cites && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 12 }}>
                      {msg.cites.map(c => (
                        <button key={c.n} onClick={() => jumpCite(c.n)} className="card" style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 10px', borderRadius: 8, cursor: 'pointer', boxShadow: 'none', maxWidth: 230,
                        }}>
                          <span style={{
                            width: 17, height: 17, borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)',
                            fontSize: 10.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>{c.n}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-sec)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.src}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
                    {[['content_copy', 'Copy'], ['thumb_up', ''], ['thumb_down', ''], ['refresh', lang === 'en' ? 'Regenerate' : '재생성']].map(([ic, lb], k) => (
                      <button key={k} className="btn btn-ghost btn-sm" style={{ height: 30, color: 'var(--muted)' }}>
                        <Icon name={ic} size={15} />{lb && <span style={{ fontSize: 12 }}>{lb}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', gap: 12 }}>
                <LogoTile provider={model.provider} size={30} radius="50%" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 30 }}>
                  {[0, 1, 2].map(d => (
                    <span key={d} style={{
                      width: 7, height: 7, borderRadius: 999, background: 'var(--muted)',
                      animation: `livepulse 1s ${d * 0.18}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* input area */}
        <div style={{ flexShrink: 0, padding: '0 24px 18px' }}>
          <div style={{ maxWidth: 740, margin: '0 auto', position: 'relative' }}>
            {showLib && (
              <>
                <div onClick={() => setShowLib(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div className="card" style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: 300, zIndex: 41, padding: 6, boxShadow: 'var(--shadow-lg)' }}>
                  <div className="t-label" style={{ padding: '8px 10px 4px' }}>{lang === 'en' ? 'Prompt library' : '프롬프트 라이브러리'}</div>
                  {PROMPT_LIBRARY.map((p, i) => (
                    <button key={i} onClick={() => { setInput(L(p, lang) + ': '); setShowLib(false); taRef.current?.focus(); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                        padding: '8px 10px', border: 'none', background: 'transparent', borderRadius: 8, cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <Icon name={p.icon} size={18} style={{ color: 'var(--accent)' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{L(p, lang)}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>{p.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="card" style={{ padding: 10, borderRadius: 'var(--radius-lg)' }}>
              {files.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 9 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', background: 'var(--surface-2)', borderRadius: 7 }}>
                      <Icon name="description" size={15} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{f.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{f.size}</span>
                      <button className="icon-btn" onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))} style={{ width: 20, height: 20 }}>
                        <Icon name="close" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                ref={taRef}
                className="field"
                rows={1}
                value={input}
                onChange={grow}
                onKeyDown={onKey}
                placeholder={lang === 'en' ? 'Message your AI service…' : '메시지를 입력하세요…'}
                style={{ border: 'none', boxShadow: 'none', padding: '4px 6px', maxHeight: 200, background: 'transparent' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button className="icon-btn" title={lang === 'en' ? 'Attach' : '파일 첨부'}
                    onClick={() => setFiles(f => [...f, { name: 'data_export.csv', size: '512 KB' }])}>
                    <Icon name="attach_file" size={19} />
                  </button>
                  <button className="icon-btn" title={lang === 'en' ? 'Voice' : '음성 입력'}>
                    <Icon name="mic" size={19} />
                  </button>
                  <button className="icon-btn" title={lang === 'en' ? 'Prompt library' : '프롬프트'}
                    onClick={() => setShowLib(s => !s)}
                    style={{ background: showLib ? 'var(--accent-soft)' : 'transparent', color: showLib ? 'var(--accent)' : 'var(--icon)' }}>
                    <Icon name="auto_awesome" size={19} />
                  </button>
                </div>
                <button className="btn btn-primary" onClick={send} disabled={!input.trim()} style={{ width: 40, padding: 0 }}>
                  <Icon name="arrow_upward" size={19} />
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--muted)', marginTop: 7 }}>
              {lang === 'en' ? 'Responses may be inaccurate — verify important information.' : 'AI 응답은 부정확할 수 있어요. 중요한 정보는 확인하세요.'}
            </div>
          </div>
        </div>
      </div>

      {/* citations panel */}
      {showCites && (
        <div style={{
          width: 300, flexShrink: 0, borderLeft: '1px solid var(--border)',
          background: 'var(--bg-rail)', height: '100%', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{lang === 'en' ? 'Citations' : '인용 출처'}</span>
            <span className="badge badge-neutral">{allCites.length}</span>
          </div>
          <div className="scroll-y" style={{ flex: 1, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allCites.length === 0 && <Empty icon="menu_book" title={lang === 'en' ? 'No citations yet' : '인용이 없어요'} />}
            {allCites.map(c => (
              <div key={c.n} className="card card-pad" style={{
                padding: 13,
                borderColor: activeCite === c.n ? 'var(--accent)' : 'var(--border)',
                boxShadow: activeCite === c.n ? '0 0 0 3px var(--accent-ring)' : 'var(--shadow-sm)',
                transition: 'all .2s',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)',
                    fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                  }}>{c.n}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-word' }}>{c.src}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{c.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
