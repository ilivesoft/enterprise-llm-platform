import { useState, useMemo, useEffect } from 'react';
import { Icon } from '../components/primitives/Icon';
import { LogoTile } from '../components/primitives/LogoTile';
import { SearchField } from '../components/primitives/SearchField';
import { Empty } from '../components/primitives/Empty';
import { PageHeader } from '../components/primitives/PageHeader';
import { useLang, L } from '../contexts/LangContext';
import { MODELS as MODELS_STATIC, CATEGORIES, PROVIDERS } from '../data';
import { getModels } from '../lib/api';
import type { Model, ModelCategory, CardStyle } from '../types';

function catLabel(catId: string, lang: string): string {
  const c = CATEGORIES.find(x => x.id === catId);
  return c ? L(c, lang as 'kr' | 'en') : catId;
}

function ModelCard({ m, lang, style }: { m: Model; lang: string; style: CardStyle }) {
  const updated = lang === 'en' ? m.updatedEn : m.updated;
  const useLabel = lang === 'en' ? 'Use' : '사용';
  const detailsLabel = lang === 'en' ? 'Details' : '상세';
  const p = PROVIDERS[m.provider];

  if (style === 'logo') {
    return (
      <div className="card card-hover" style={{ overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          height: 92,
          background: `linear-gradient(135deg, ${p?.color || '#64748B'} 0%, color-mix(in srgb, ${p?.color || '#64748B'} 70%, #000) 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}>
          <span className="logo-tile" style={{ width: 46, height: 46, background: 'rgba(255,255,255,.18)', fontSize: 22, borderRadius: 12 }}>
            {p?.initial || '?'}
          </span>
          {m.featured && (
            <span className="badge" style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,.22)', color: '#fff' }}>
              <Icon name="star" size={12} fill /> {lang === 'en' ? 'Featured' : '추천'}
            </span>
          )}
        </div>
        <div className="card-pad" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{m.name}</div>
          <div className="t-meta" style={{ marginTop: 2 }}>{m.provider} · {catLabel(m.cat, lang)}</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <span className="t-meta">{updated}</span>
            <button className="btn btn-secondary btn-sm">{useLabel}</button>
          </div>
        </div>
      </div>
    );
  }

  if (style === 'compact') {
    return (
      <div className="card card-hover" style={{ padding: 'var(--pad-tight)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <LogoTile provider={m.provider} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
            {m.params !== '—' && <span className="badge badge-neutral" style={{ height: 18 }}>{m.params}</span>}
          </div>
          <div className="t-meta" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {m.provider} · {catLabel(m.cat, lang)} · {updated}
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}><Icon name="arrow_forward" size={16} /></button>
      </div>
    );
  }

  // detailed (default)
  return (
    <div className="card card-hover card-pad" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <LogoTile provider={m.provider} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{m.name}</span>
            {m.featured && <Icon name="verified" size={16} fill style={{ color: 'var(--accent)' }} />}
          </div>
          <div className="t-meta" style={{ marginTop: 2 }}>{m.provider} · v{m.version}</div>
        </div>
        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={e => e.stopPropagation()}>
          <Icon name="bookmark_border" size={18} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, margin: '14px 0' }}>
        <div>
          <div className="t-label">{lang === 'en' ? 'Params' : '파라미터'}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }} className="t-mono">{m.params}</div>
        </div>
        <div>
          <div className="t-label">{lang === 'en' ? 'Context' : '컨텍스트'}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }} className="t-mono">{m.ctx}</div>
        </div>
        <div>
          <div className="t-label">{lang === 'en' ? 'Task' : '태스크'}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 3 }}>{catLabel(m.cat, lang)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {m.tags.slice(0, 4).map(t => (
          <span key={t} style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-sec)', background: 'var(--surface-2)', padding: '3px 8px', borderRadius: 6 }}>
            {t}
          </span>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <span className="t-meta"><Icon name="schedule" size={13} style={{ verticalAlign: '-2px', marginRight: 3 }} />{updated}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm">{detailsLabel}</button>
          <button className="btn btn-primary btn-sm">{useLabel}</button>
        </div>
      </div>
    </div>
  );
}

interface MarketplaceProps {
  cardStyle: CardStyle;
}

export function Marketplace({ cardStyle }: MarketplaceProps) {
  const lang = useLang();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [provider, setProvider] = useState('all');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [models, setModels] = useState<Model[]>(MODELS_STATIC);
  const pageSize = cardStyle === 'compact' ? 12 : 9;

  useEffect(() => {
    getModels({ per_page: 100 }).then(r => {
      const now = new Date();
      const mapped: Model[] = r.data.items.map((m: Record<string, unknown>) => {
        const updatedAt = new Date(m.updated_at as string);
        const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / 86400000);
        const updated = diffDays === 0 ? '오늘' : diffDays < 7 ? `${diffDays}일 전` : diffDays < 30 ? `${Math.floor(diffDays / 7)}주 전` : `${Math.floor(diffDays / 30)}개월 전`;
        const updatedEn = diffDays === 0 ? 'Today' : diffDays < 7 ? `${diffDays} days ago` : diffDays < 30 ? `${Math.floor(diffDays / 7)} weeks ago` : `${Math.floor(diffDays / 30)} months ago`;
        return {
          id: m.id as string,
          name: m.name as string,
          provider: m.provider as string,
          version: m.version as string,
          params: m.params as string,
          cat: (m.category as ModelCategory) || 'text',
          ctx: m.context_window as string,
          tags: (m.tags as string[]) || [],
          featured: m.featured as boolean,
          updated,
          updatedEn,
        };
      });
      setModels(mapped);
    }).catch(() => {});
  }, []);

  const providers = useMemo(() => ['all', ...Array.from(new Set(models.map(m => m.provider)))], [models]);

  const filtered = useMemo(() => {
    let r = models.filter(m =>
      (cat === 'all' || m.cat === cat) &&
      (provider === 'all' || m.provider === provider) &&
      (q === '' || (m.name + m.provider + m.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'featured') r = [...r].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return r;
  }, [q, cat, provider, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const cur = Math.min(page, pages);
  const shown = filtered.slice((cur - 1) * pageSize, cur * pageSize);

  const gridCols = cardStyle === 'compact' ? 'repeat(auto-fill, minmax(340px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))';

  return (
    <div className="view-in" style={{ padding: '20px 24px 40px' }}>
      <PageHeader
        title={lang === 'en' ? 'Model Marketplace' : '모델 마켓플레이스'}
        subtitle={lang === 'en' ? 'Browse and deploy foundation models across providers.' : '여러 제공사의 파운데이션 모델을 탐색하고 배포하세요.'}
        actions={
          <button className="btn btn-secondary">
            <Icon name="upload" size={17} /> {lang === 'en' ? 'Import model' : '모델 등록'}
          </button>
        }
      />

      {/* sticky filters */}
      <div style={{ position: 'sticky', top: 0, zIndex: 9, background: 'var(--bg)', paddingBottom: 12, marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchField
            value={q}
            onChange={v => { setQ(v); setPage(1); }}
            placeholder={lang === 'en' ? 'Search models…' : '모델 검색…'}
            style={{ flex: 1, minWidth: 220, maxWidth: 360 }}
          />
          <select className="field" value={provider} onChange={e => { setProvider(e.target.value); setPage(1); }} style={{ width: 'auto', minWidth: 150 }}>
            {providers.map(p => (
              <option key={p} value={p}>{p === 'all' ? (lang === 'en' ? 'All providers' : '전체 제공사') : p}</option>
            ))}
          </select>
          <select className="field" value={sort} onChange={e => setSort(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
            <option value="recent">{lang === 'en' ? 'Recently updated' : '최근 업데이트순'}</option>
            <option value="featured">{lang === 'en' ? 'Featured first' : '추천순'}</option>
            <option value="name">{lang === 'en' ? 'Name (A–Z)' : '이름순'}</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} className={'chip' + (cat === c.id ? ' active' : '')} onClick={() => { setCat(c.id); setPage(1); }}>
              <Icon name={c.icon} size={15} /> {L(c, lang as 'kr' | 'en')}
            </button>
          ))}
        </div>
      </div>

      <div className="t-meta" style={{ margin: '6px 2px 14px' }}>
        {filtered.length}{lang === 'en' ? ' models' : '개 모델'}{cat !== 'all' ? ` · ${catLabel(cat, lang)}` : ''}
      </div>

      {shown.length === 0 ? (
        <Empty
          icon="search_off"
          title={lang === 'en' ? 'No models found' : '모델을 찾을 수 없어요'}
          sub={lang === 'en' ? 'Try a different search or filter.' : '다른 검색어나 필터를 사용해 보세요.'}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 'var(--gap)' }}>
          {shown.map(m => <ModelCard key={m.id} m={m} lang={lang} style={cardStyle} />)}
        </div>
      )}

      {/* pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 32 }}>
          <button className="icon-btn" disabled={cur === 1} onClick={() => setPage(cur - 1)} style={{ opacity: cur === 1 ? .4 : 1 }}>
            <Icon name="chevron_left" size={20} />
          </button>
          {Array.from({ length: pages }).map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className="btn btn-sm"
              style={{
                minWidth: 34, height: 34,
                background: cur === i + 1 ? 'var(--accent)' : 'transparent',
                color: cur === i + 1 ? '#fff' : 'var(--text-sec)',
                border: cur === i + 1 ? 'none' : '1px solid var(--border)',
              }}>
              {i + 1}
            </button>
          ))}
          <button className="icon-btn" disabled={cur === pages} onClick={() => setPage(cur + 1)} style={{ opacity: cur === pages ? .4 : 1 }}>
            <Icon name="chevron_right" size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
