import type { ProviderBreakdown, ModelBreakdown } from '../../types';

interface DonutProps {
  segments: ProviderBreakdown[];
  size?: number;
  thickness?: number;
}

export function DonutChart({ segments, size = 168, thickness = 26 }: DonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const total = segments.reduce((s, x) => s + x.pct, 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((s, i) => {
          const len = (s.pct / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </g>
    </svg>
  );
}

interface HBarsProps {
  rows: ModelBreakdown[];
  lang: string;
}

export function HBars({ rows }: HBarsProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((r, i) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{r.name}</span>
            <span className="t-mono" style={{ fontSize: 12.5, color: 'var(--muted)' }}>{r.value}</span>
          </div>
          <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: r.pct + '%', height: '100%', background: 'var(--accent)', borderRadius: 999 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
