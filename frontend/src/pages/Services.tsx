import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/primitives/Icon';
import { LogoTile } from '../components/primitives/LogoTile';
import { Badge, StatusBadge } from '../components/primitives/Badge';
import { SearchField } from '../components/primitives/SearchField';
import { Segmented } from '../components/primitives/Segmented';
import { Empty } from '../components/primitives/Empty';
import { PageHeader } from '../components/primitives/PageHeader';
import { useLang, L } from '../contexts/LangContext';
import { MODELS, STATUS } from '../data';
import { getServices, toggleFavorite, mapService, createService, deleteService, updateService, createConversation, mapConversation, listDocs, uploadDoc, deleteDoc } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import type { Service } from '../types';

interface DocItem {
  doc_id: string;
  filename: string;
  chunk_count: number;
  ingested_at: string;
}

function RagDocsModal({ s, lang, onClose }: { s: Service; lang: string; onClose: () => void }) {
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listDocs(s.id).then(r => setDocs(r.data)).catch(() => {});
  }, [s.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr('');
    try {
      await uploadDoc(s.id, file);
      const r = await listDocs(s.id);
      setDocs(r.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setUploadErr(msg || (lang === 'en' ? 'Upload failed.' : '업로드 실패.'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(docId: string) {
    await deleteDoc(s.id, docId).catch(() => {});
    setDocs(d => d.filter(x => x.doc_id !== docId));
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100 }} />
      <div className="card" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        zIndex: 101, padding: 0, boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge variant="accent" icon="database">RAG</Badge>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{L({ kr: s.name, en: s.nameEn }, lang as 'kr' | 'en')}</span>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>

        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,.csv" style={{ display: 'none' }} onChange={handleUpload} />
          <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Icon name="upload_file" size={16} />
            {uploading ? (lang === 'en' ? 'Uploading…' : '업로드 중…') : (lang === 'en' ? 'Upload document' : '문서 업로드')}
          </button>
          <span style={{ fontSize: 11.5, color: 'var(--muted)', marginLeft: 10 }}>
            {lang === 'en' ? 'PDF, DOCX, TXT, MD, CSV' : 'PDF, DOCX, TXT, MD, CSV 지원'}
          </span>
          {uploadErr && <div style={{ color: 'var(--error)', fontSize: 12, marginTop: 6 }}>{uploadErr}</div>}
        </div>

        <div className="scroll-y" style={{ flex: 1, padding: 14 }}>
          {docs.length === 0 ? (
            <Empty icon="upload_file" title={lang === 'en' ? 'No documents yet' : '업로드된 문서가 없어요'}
              sub={lang === 'en' ? 'Upload a file to enable RAG responses.' : '파일을 업로드하면 RAG 응답이 활성화됩니다.'} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docs.map(d => (
                <div key={d.doc_id} className="card" style={{ padding: '10px 14px', boxShadow: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Icon name="description" size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.filename}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                      {d.chunk_count} {lang === 'en' ? 'chunks' : '청크'} · {new Date(d.ingested_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button className="icon-btn" style={{ width: 28, height: 28, flexShrink: 0 }} onClick={() => handleDelete(d.doc_id)}>
                    <Icon name="delete_outline" size={16} style={{ color: 'var(--muted)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ServiceCard({ s, lang, onFav, onDelete, onOpenChat, onOpenDocs, onToggleStatus, onEdit }: {
  s: Service; lang: string;
  onFav: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenChat: (s: Service) => void;
  onOpenDocs: (s: Service) => void;
  onToggleStatus: (s: Service) => void;
  onEdit: (s: Service) => void;
}) {
  return (
    <div className="card card-hover card-pad" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <LogoTile provider={s.provider} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {L({ kr: s.name, en: s.nameEn }, lang as 'kr' | 'en')}
          </div>
          <div className="t-meta" style={{ marginTop: 2 }}>{s.model}</div>
        </div>
        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => onFav(s.id)}>
          <Icon name={s.fav ? 'star' : 'star_border'} size={18} fill={s.fav} style={{ color: s.fav ? 'var(--warning)' : 'var(--icon)' }} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0', flexWrap: 'wrap' }}>
        <StatusBadge status={s.status} />
        {s.rag ? (
          <button className="badge badge-accent" style={{ cursor: 'pointer', border: 'none' }} onClick={() => onOpenDocs(s)}>
            <Icon name="database" size={13} />RAG
          </button>
        ) : (
          <span className="badge badge-neutral" style={{ opacity: .8 }}><Icon name="database" size={13} />{lang === 'en' ? 'No RAG' : 'RAG 없음'}</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div className="t-label">{lang === 'en' ? 'Requests (30d)' : '요청 (30일)'}</div>
          <div className="t-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{s.reqs}</div>
        </div>
        <div>
          <div className="t-label">{lang === 'en' ? 'Avg latency' : '평균 지연'}</div>
          <div className="t-mono" style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{s.latency}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <span className="t-meta">
          <Icon name="calendar_today" size={12} style={{ verticalAlign: '-1px', marginRight: 4 }} />
          {s.created}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(s.id)} title={lang === 'en' ? 'Delete' : '삭제'}>
            <Icon name="delete_outline" size={15} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(s)} title={lang === 'en' ? 'Edit' : '편집'}>
            <Icon name="edit" size={15} />
          </button>
          {(s.status === 'running' || s.status === 'stopped') && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onToggleStatus(s)}
              title={s.status === 'running' ? (lang === 'en' ? 'Stop' : '중지') : (lang === 'en' ? 'Start' : '시작')}
              style={{ color: s.status === 'running' ? 'var(--error)' : 'var(--success)' }}
            >
              <Icon name={s.status === 'running' ? 'stop_circle' : 'play_circle'} size={15} />
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => onOpenChat(s)} disabled={s.status === 'stopped' || s.status === 'error'}>
            <Icon name="forum" size={15} /> {lang === 'en' ? 'Open chat' : '채팅 열기'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewServiceForm {
  name: string;
  nameEn: string;
  modelId: string;
  provider: string;
  ragEnabled: boolean;
}

function ServiceModal({ lang, onClose, onCreate }: {
  lang: string;
  onClose: () => void;
  onCreate: (s: Service) => void;
}) {
  const textModels = MODELS.filter(m => m.cat === 'text');
  const [form, setForm] = useState<NewServiceForm>({ name: '', nameEn: '', modelId: textModels[0]?.id || '', provider: textModels[0]?.provider || '', ragEnabled: false });
  const [saving, setSaving] = useState(false);

  function handleModelChange(modelId: string) {
    const m = MODELS.find(x => x.id === modelId);
    setForm(f => ({ ...f, modelId, provider: m?.provider || '' }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await createService({
        name: form.name,
        name_en: form.nameEn || form.name,
        model_id: form.modelId,
        provider: form.provider,
        rag_enabled: form.ragEnabled,
        status: 'stopped',
      });
      onCreate(mapService(r.data));
      onClose();
    } catch { } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100 }} />
      <div className="card" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 480, zIndex: 101, padding: 28, boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{lang === 'en' ? 'New service' : '서비스 생성'}</span>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Name (KR)' : '이름 (한국어)'}</div>
            <input className="field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={lang === 'en' ? 'e.g. 고객지원 봇' : '예: 고객지원 봇'} required />
          </div>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Name (EN)' : '이름 (영어)'}</div>
            <input className="field" value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} placeholder="e.g. Customer Support Bot" />
          </div>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Model' : '모델'}</div>
            <select className="field" value={form.modelId} onChange={e => handleModelChange(e.target.value)}>
              {textModels.map(m => <option key={m.id} value={m.id}>{m.name} · {m.provider}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.ragEnabled} onChange={e => setForm(f => ({ ...f, ragEnabled: e.target.checked }))} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>{lang === 'en' ? 'Enable RAG (document Q&A)' : 'RAG 활성화 (문서 기반 Q&A)'}</span>
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>{lang === 'en' ? 'Cancel' : '취소'}</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
              {saving ? (lang === 'en' ? 'Creating…' : '생성 중…') : (lang === 'en' ? 'Create' : '생성')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function EditServiceModal({ s, lang, onClose, onSave }: {
  s: Service; lang: string;
  onClose: () => void;
  onSave: (updated: Service) => void;
}) {
  const textModels = MODELS.filter(m => m.cat === 'text');
  const [name, setName] = useState(s.name);
  const [nameEn, setNameEn] = useState(s.nameEn);
  const [modelId, setModelId] = useState(s.model);
  const [saving, setSaving] = useState(false);

  function handleModelChange(id: string) {
    const m = MODELS.find(x => x.id === id);
    setModelId(m?.id || id);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const r = await updateService(s.id, { name: name.trim(), name_en: nameEn || name.trim(), model_id: modelId });
      onSave(mapService(r.data));
      onClose();
    } catch {} finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100 }} />
      <div className="card" style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 460, zIndex: 101, padding: 28, boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{lang === 'en' ? 'Edit service' : '서비스 편집'}</span>
          <button className="icon-btn" onClick={onClose}><Icon name="close" size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Name (KR)' : '이름 (한국어)'}</div>
            <input className="field" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Name (EN)' : '이름 (영어)'}</div>
            <input className="field" value={nameEn} onChange={e => setNameEn(e.target.value)} />
          </div>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Model' : '모델'}</div>
            <select className="field" value={modelId} onChange={e => handleModelChange(e.target.value)}>
              {textModels.map(m => <option key={m.id} value={m.id}>{m.name} · {m.provider}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>{lang === 'en' ? 'Cancel' : '취소'}</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
              {saving ? (lang === 'en' ? 'Saving…' : '저장 중…') : (lang === 'en' ? 'Save' : '저장')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export function Services() {
  const lang = useLang();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState('grid');
  const [favOnly, setFavOnly] = useState(false);
  const [data, setData] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [ragService, setRagService] = useState<Service | null>(null);
  const [editService, setEditService] = useState<Service | null>(null);

  useEffect(() => {
    getServices().then(r => setData(r.data.map(mapService))).catch(() => {
      showToast(lang === 'en' ? 'Failed to load services.' : '서비스 목록을 불러오지 못했습니다.', 'error');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFav = (id: string) => {
    toggleFavorite(id).catch(() => {});
    setData(d => d.map(s => s.id === id ? { ...s, fav: !s.fav } : s));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Delete this service?' : '서비스를 삭제하시겠습니까?')) return;
    try {
      await deleteService(id);
      setData(d => d.filter(s => s.id !== id));
      showToast(lang === 'en' ? 'Service deleted.' : '서비스가 삭제되었습니다.', 'success');
    } catch {
      showToast(lang === 'en' ? 'Failed to delete service.' : '서비스 삭제에 실패했습니다.', 'error');
    }
  };

  const handleToggleStatus = async (s: Service) => {
    const next = s.status === 'running' ? 'stopped' : 'running';
    try {
      await updateService(s.id, { status: next });
      setData(d => d.map(x => x.id === s.id ? { ...x, status: next as Service['status'] } : x));
      showToast(
        next === 'running'
          ? (lang === 'en' ? 'Service started.' : '서비스가 시작되었습니다.')
          : (lang === 'en' ? 'Service stopped.' : '서비스가 중지되었습니다.'),
        'success'
      );
    } catch {
      showToast(lang === 'en' ? 'Status update failed.' : '상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleEdit = (s: Service) => setEditService(s);

  const handleSaveEdit = (updated: Service) => {
    setData(d => d.map(x => x.id === updated.id ? updated : x));
    showToast(lang === 'en' ? 'Service updated.' : '서비스가 업데이트되었습니다.', 'success');
  };

  const handleOpenChat = async (s: Service) => {
    try {
      const r = await createConversation({ service_id: s.id, title: L({ kr: s.name, en: s.nameEn }, lang as 'kr' | 'en') });
      const conv = mapConversation(r.data);
      navigate(`/chat?conv=${conv.id}`);
    } catch {
      navigate('/chat');
    }
  };

  const handleOpenDocs = (s: Service) => setRagService(s);

  const statusFilters = [
    { id: 'all', label: lang === 'en' ? 'All' : '전체' },
    ...Object.entries(STATUS).map(([k, v]) => ({ id: k, label: L(v, lang) })),
  ];

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data.length };
    Object.keys(STATUS).forEach(k => c[k] = data.filter(s => s.status === k).length);
    return c;
  }, [data]);

  const filtered = data.filter(s =>
    (status === 'all' || s.status === status) &&
    (!favOnly || s.fav) &&
    (q === '' || (s.name + s.nameEn + s.model).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="view-in" style={{ padding: '20px 24px 40px' }}>
      {showModal && <ServiceModal lang={lang} onClose={() => setShowModal(false)} onCreate={s => { setData(d => [s, ...d]); showToast(lang === 'en' ? 'Service created.' : '서비스가 생성되었습니다.', 'success'); }} />}
      {ragService && <RagDocsModal s={ragService} lang={lang} onClose={() => setRagService(null)} />}
      {editService && <EditServiceModal s={editService} lang={lang} onClose={() => setEditService(null)} onSave={handleSaveEdit} />}
      <PageHeader
        title={lang === 'en' ? 'AI Services' : 'AI 서비스'}
        subtitle={lang === 'en' ? 'Manage, monitor, and chat with your deployed services.' : '배포된 AI 서비스를 관리하고 모니터링하세요.'}
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Icon name="add" size={17} /> {lang === 'en' ? 'New service' : '서비스 생성'}
          </button>
        }
      />

      {/* summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {[
          { k: lang === 'en' ? 'Total services' : '전체 서비스', v: data.length, ic: 'lan', c: 'var(--text)' },
          { k: lang === 'en' ? 'Running' : '실행 중', v: counts.running, ic: 'play_circle', c: 'var(--success)' },
          { k: lang === 'en' ? 'Training' : '학습 중', v: counts.training, ic: 'model_training', c: 'var(--accent)' },
          { k: lang === 'en' ? 'Need attention' : '점검 필요', v: (counts.error || 0) + (counts.stopped || 0), ic: 'warning', c: 'var(--error)' },
        ].map((x, i) => (
          <div key={i} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={x.ic} size={20} style={{ color: x.c }} />
            </span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }} className="t-mono">{x.v}</div>
              <div className="t-meta" style={{ marginTop: 3 }}>{x.k}</div>
            </div>
          </div>
        ))}
      </div>

      {/* sticky filter bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 9, background: 'var(--bg)', paddingBottom: 12, marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <SearchField value={q} onChange={setQ} placeholder={lang === 'en' ? 'Search services…' : '서비스 검색…'} style={{ flex: 1, minWidth: 200, maxWidth: 340 }} />
          <button className={'chip' + (favOnly ? ' active' : '')} onClick={() => setFavOnly(f => !f)} style={{ height: 38 }}>
            <Icon name="star" size={15} fill={favOnly} /> {lang === 'en' ? 'Favorites' : '즐겨찾기'}
          </button>
          <div style={{ flex: 1 }} />
          <Segmented
            options={[
              { value: 'grid', label: lang === 'en' ? 'Grid' : '그리드' },
              { value: 'table', label: lang === 'en' ? 'Table' : '테이블' },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
          {statusFilters.map(f => (
            <button key={f.id} className={'chip' + (status === f.id ? ' active' : '')} onClick={() => setStatus(f.id)}>
              {f.label} <span style={{ opacity: .7, fontVariantNumeric: 'tabular-nums' }}>{counts[f.id] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Empty icon="lan" title={lang === 'en' ? 'No services match' : '일치하는 서비스가 없어요'} />
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--gap)' }}>
          {filtered.map(s => <ServiceCard key={s.id} s={s} lang={lang} onFav={toggleFav} onDelete={handleDelete} onOpenChat={handleOpenChat} onOpenDocs={handleOpenDocs} onToggleStatus={handleToggleStatus} onEdit={handleEdit} />)}
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ paddingTop: 14 }}>{lang === 'en' ? 'Service' : '서비스'}</th>
                <th>{lang === 'en' ? 'Model' : '모델'}</th>
                <th>RAG</th>
                <th>{lang === 'en' ? 'Status' : '상태'}</th>
                <th>{lang === 'en' ? 'Requests' : '요청'}</th>
                <th>{lang === 'en' ? 'Created' : '생성일'}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <button className="icon-btn" style={{ width: 26, height: 26 }} onClick={() => toggleFav(s.id)}>
                        <Icon name={s.fav ? 'star' : 'star_border'} size={16} fill={s.fav} style={{ color: s.fav ? 'var(--warning)' : 'var(--icon)' }} />
                      </button>
                      <LogoTile provider={s.provider} size={30} />
                      <span style={{ fontWeight: 600 }}>{L({ kr: s.name, en: s.nameEn }, lang as 'kr' | 'en')}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-sec)' }}>{s.model}</td>
                  <td>
                    {s.rag ? (
                      <button className="badge badge-accent" style={{ cursor: 'pointer', border: 'none' }} onClick={() => handleOpenDocs(s)}>
                        <Icon name="database" size={12} />RAG
                      </button>
                    ) : <span className="t-meta">—</span>}
                  </td>
                  <td><StatusBadge status={s.status} /></td>
                  <td className="t-mono">{s.reqs}</td>
                  <td className="t-meta">{s.created}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s.id)} title={lang === 'en' ? 'Delete' : '삭제'}>
                        <Icon name="delete_outline" size={16} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenChat(s)} disabled={s.status === 'stopped' || s.status === 'error'}>
                        <Icon name="forum" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
