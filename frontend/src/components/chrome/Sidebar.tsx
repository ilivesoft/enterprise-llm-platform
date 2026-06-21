import iliveLogo from '../../assets/ilive-logo-en.png';
import { Icon } from '../primitives/Icon';
import { Avatar } from '../primitives/Avatar';
import { useLang, L } from '../../contexts/LangContext';
import { NAV, NAV_SECONDARY } from '../../data';
import type { NavItem } from '../../types';

interface SidebarProps {
  current: string;
  onNav: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <img src={iliveLogo} alt="iLive" style={{ height: 22, flexShrink: 0 }} />
      {!collapsed && (
        <span style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '.5px', color: 'var(--muted)',
          position: 'relative', top: 6, textTransform: 'uppercase',
        }}>
          LLM Platform
        </span>
      )}
    </div>
  );
}

function NavItemBtn({ n, current, onNav, collapsed }: { n: NavItem; current: string; onNav: (id: string) => void; collapsed: boolean }) {
  const lang = useLang();
  const active = current === n.id;
  return (
    <button
      onClick={() => onNav(n.id)}
      title={L(n, lang)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: collapsed ? '0' : '0 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        height: 42, border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-sec)',
        font: '500 13.5px/1 var(--ap-font)', transition: 'background .14s, color .14s', position: 'relative',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {active && (
        <span style={{
          position: 'absolute', left: -1, top: 9, bottom: 9,
          width: 3, borderRadius: 3, background: 'var(--accent)',
        }} />
      )}
      <Icon name={n.icon} size={21} fill={active} style={{ flexShrink: 0 }} />
      {!collapsed && (
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {L(n, lang)}
        </span>
      )}
    </button>
  );
}

function SmallItem({ n, current, onNav, collapsed }: { n: NavItem; current: string; onNav: (id: string) => void; collapsed: boolean }) {
  const lang = useLang();
  const active = current === n.id;
  return (
    <button
      title={L(n, lang)}
      onClick={() => onNav(n.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: collapsed ? 0 : '0 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        height: 38, border: 'none', cursor: 'pointer',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-sec)',
        fontSize: 13.5, fontWeight: 500, position: 'relative',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {active && (
        <span style={{ position: 'absolute', left: -1, top: 8, bottom: 8, width: 3, borderRadius: 3, background: 'var(--accent)' }} />
      )}
      <Icon name={n.icon} size={20} fill={active} style={{ flexShrink: 0 }} />
      {!collapsed && L(n, lang)}
    </button>
  );
}

export function Sidebar({ current, onNav, collapsed, onToggle }: SidebarProps) {
  const lang = useLang();

  return (
    <aside style={{
      width: collapsed ? 'var(--rail-w-collapsed)' : 'var(--rail-w)',
      flexShrink: 0,
      background: 'var(--bg-rail)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      transition: 'width .18s ease',
    }}>
      <div style={{
        height: 'var(--topbar-h)', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? 0 : '0 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        {!collapsed && <Brand collapsed={collapsed} />}
        <button className="icon-btn" onClick={onToggle} title="Toggle sidebar" style={{ width: 34, height: 34 }}>
          <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={20} />
        </button>
      </div>

      <nav style={{
        flex: 1, padding: collapsed ? '12px 10px' : '12px',
        display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto',
      }}>
        {!collapsed && (
          <div className="t-label" style={{ padding: '8px 12px 6px' }}>
            {lang === 'en' ? 'Workspace' : '워크스페이스'}
          </div>
        )}
        {NAV.map(n => (
          <NavItemBtn key={n.id} n={n} current={current} onNav={onNav} collapsed={collapsed} />
        ))}
        <hr className="hr" style={{ margin: '8px 4px' }} />
        {NAV_SECONDARY.map(n => (
          <NavItemBtn key={n.id} n={n} current={current} onNav={onNav} collapsed={collapsed} />
        ))}
      </nav>

      <div style={{
        padding: collapsed ? '10px' : '12px',
        borderTop: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        <SmallItem
          n={{ id: 'api-keys', icon: 'key', kr: 'API 키', en: 'API keys' }}
          current={current} onNav={onNav} collapsed={collapsed}
        />
        <SmallItem
          n={{ id: 'settings', icon: 'settings', kr: '설정', en: 'Settings' }}
          current={current} onNav={onNav} collapsed={collapsed}
        />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '6px 0' : '8px 8px', marginTop: 4,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <Avatar label="정" color="#0F172A" size={collapsed ? 30 : 32} />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>정기현</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Acme Corp · Admin
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
