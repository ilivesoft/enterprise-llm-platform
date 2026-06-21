import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 16, marginBottom: 'var(--gap)', flexWrap: 'wrap',
    }}>
      <div>
        <h1 className="t-h1">{title}</h1>
        {subtitle && <div className="t-sec" style={{ marginTop: 4 }}>{subtitle}</div>}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
