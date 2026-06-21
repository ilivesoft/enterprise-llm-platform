import { Icon } from '../primitives/Icon';
import { L } from '../../contexts/LangContext';
import { NAV, NAV_SECONDARY } from '../../data';
import type { Theme, Lang } from '../../types';

interface TopBarProps {
  current: string;
  theme: Theme;
  onToggleTheme: () => void;
  lang: Lang;
  onToggleLang: (lang: Lang) => void;
}

const EXTRA_ITEMS: Record<string, { icon: string; kr: string; en: string }> = {
  'api-keys': { icon: 'key',      kr: 'API 키', en: 'API Keys' },
  'settings':  { icon: 'settings', kr: '설정',   en: 'Settings' },
};

export function TopBar({ current, theme, onToggleTheme, lang, onToggleLang }: TopBarProps) {
  const navItem = NAV.find(n => n.id === current) || NAV_SECONDARY.find(n => n.id === current) || EXTRA_ITEMS[current];
  const ph = lang === 'en' ? 'Search models, services, docs…' : '모델, 서비스, 문서 검색…';

  return (
    <header style={{
      height: 'var(--topbar-h)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 30,
      background: 'color-mix(in srgb, var(--bg) 88%, transparent)',
      backdropFilter: 'saturate(140%) blur(8px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <Icon name={navItem?.icon ?? 'tune'} size={20} style={{ color: 'var(--muted)' }} />
        <span style={{ fontSize: 14.5, fontWeight: 650, color: 'var(--text)', whiteSpace: 'nowrap' }}>
          {navItem ? L(navItem, lang) : '—'}
        </span>
      </div>

      <div style={{ flex: 1, maxWidth: 460, margin: '0 auto' }}>
        <div className="search-wrap">
          <Icon name="search" />
          <input
            className="field"
            placeholder={ph}
            style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}
          />
          <kbd style={{
            position: 'absolute', right: 10, fontSize: 11, color: 'var(--muted)',
            border: '1px solid var(--border)', borderRadius: 5, padding: '2px 6px',
            background: 'var(--surface)', fontFamily: 'var(--ap-mono)',
          }}>
            ⌘K
          </kbd>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div className="seg" style={{ height: 34 }}>
          <button className={lang === 'kr' ? 'active' : ''} onClick={() => onToggleLang('kr')} style={{ height: 26 }}>KR</button>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => onToggleLang('en')} style={{ height: 26 }}>EN</button>
        </div>
        <button className="icon-btn" onClick={onToggleTheme} title="Toggle theme">
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={20} />
        </button>
        <button className="icon-btn" title="Notifications" style={{ position: 'relative' }}>
          <Icon name="notifications" size={20} />
          <span style={{
            position: 'absolute', top: 7, right: 8, width: 7, height: 7,
            borderRadius: 999, background: 'var(--accent)', border: '2px solid var(--bg)',
          }} />
        </button>
        <button className="btn btn-primary btn-sm" style={{ height: 34, marginLeft: 4 }}>
          <Icon name="add" size={16} /> {lang === 'en' ? 'New service' : '서비스 생성'}
        </button>
      </div>
    </header>
  );
}
