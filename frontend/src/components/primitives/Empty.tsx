import { Icon } from './Icon';

interface EmptyProps {
  icon?: string;
  title?: string;
  sub?: string;
}

export function Empty({ icon = 'inbox', title, sub }: EmptyProps) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--muted)' }}>
      <Icon name={icon} size={40} style={{ color: 'var(--border-strong)' }} />
      <div style={{ marginTop: 12, fontWeight: 600, color: 'var(--text-sec)' }}>{title}</div>
      {sub && <div style={{ marginTop: 4, fontSize: 13 }}>{sub}</div>}
    </div>
  );
}
