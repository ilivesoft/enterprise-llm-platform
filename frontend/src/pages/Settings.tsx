import { useState, useContext } from 'react';
import { Icon } from '../components/primitives/Icon';
import { PageHeader } from '../components/primitives/PageHeader';
import { Switch } from '../components/primitives/Switch';
import { useLang } from '../contexts/LangContext';
import { ThemeContext } from '../contexts/ThemeContext';

export function Settings() {
  const lang = useLang();
  const { theme, setTheme } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState(true);
  const [costAlerts, setCostAlerts] = useState(true);
  const [costThreshold, setCostThreshold] = useState('500');
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="view-in" style={{ padding: '20px 24px 40px', maxWidth: 720, margin: '0 auto' }}>
      <PageHeader
        title={lang === 'en' ? 'Settings' : '설정'}
        subtitle={lang === 'en' ? 'Manage your platform preferences and account settings.' : '플랫폼 환경설정 및 계정 설정을 관리하세요.'}
      />

      {/* 계정 정보 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px', textTransform: 'uppercase', marginBottom: 12 }}>
          {lang === 'en' ? 'Account' : '계정'}
        </div>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Name' : '이름'}</div>
              <input className="field" defaultValue="정기현" readOnly style={{ background: 'var(--surface-2)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Organization' : '조직'}</div>
              <input className="field" defaultValue="Acme Corp" readOnly style={{ background: 'var(--surface-2)' }} />
            </div>
          </div>
          <div>
            <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Role' : '역할'}</div>
            <input className="field" defaultValue="Admin" readOnly style={{ background: 'var(--surface-2)' }} />
          </div>
        </div>
      </section>

      {/* 외관 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px', textTransform: 'uppercase', marginBottom: 12 }}>
          {lang === 'en' ? 'Appearance' : '외관'}
        </div>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name={theme === 'dark' ? 'dark_mode' : 'light_mode'} size={20} style={{ color: 'var(--accent)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'en' ? 'Dark mode' : '다크 모드'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>
                  {lang === 'en' ? 'Switch between light and dark theme.' : '라이트/다크 테마를 전환합니다.'}
                </div>
              </div>
            </div>
            <Switch checked={theme === 'dark'} onChange={v => setTheme(v ? 'dark' : 'light')} />
          </div>
        </div>
      </section>

      {/* 알림 */}
      <section style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.4px', textTransform: 'uppercase', marginBottom: 12 }}>
          {lang === 'en' ? 'Notifications' : '알림'}
        </div>
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="notifications" size={20} style={{ color: notifications ? 'var(--accent)' : 'var(--muted)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'en' ? 'System notifications' : '시스템 알림'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>
                  {lang === 'en' ? 'Service status changes and errors.' : '서비스 상태 변경 및 오류 알림.'}
                </div>
              </div>
            </div>
            <Switch checked={notifications} onChange={setNotifications} />
          </div>

          <hr className="hr" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="attach_money" size={20} style={{ color: costAlerts ? 'var(--accent)' : 'var(--muted)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === 'en' ? 'Cost alerts' : '비용 알림'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 1 }}>
                  {lang === 'en' ? 'Alert when monthly spend exceeds threshold.' : '월간 비용이 임계값을 초과하면 알림.'}
                </div>
              </div>
            </div>
            <Switch checked={costAlerts} onChange={setCostAlerts} />
          </div>

          {costAlerts && (
            <div style={{ paddingLeft: 30 }}>
              <div className="t-label" style={{ marginBottom: 6 }}>{lang === 'en' ? 'Monthly threshold (USD)' : '월간 임계값 (USD)'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--muted)' }}>$</span>
                <input
                  className="field"
                  type="number"
                  min="0"
                  value={costThreshold}
                  onChange={e => setCostThreshold(e.target.value)}
                  style={{ width: 140 }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={save}>
          {saved
            ? <><Icon name="check" size={17} />{lang === 'en' ? 'Saved' : '저장됨'}</>
            : <><Icon name="save" size={17} />{lang === 'en' ? 'Save settings' : '설정 저장'}</>}
        </button>
      </div>
    </div>
  );
}
