import { useState, useRef, useLayoutEffect } from 'react';

interface BarChartProps {
  data: number[];
  height?: number;
  fmt?: (v: number) => string;
  labels?: string[];
  accent?: string;
}

function useMeasure(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => { setW(entries[0].contentRect.width); });
    ro.observe(ref.current);
    setW(ref.current.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function BarChart({ data, height = 240, fmt = v => String(v), labels, accent = 'var(--accent)' }: BarChartProps) {
  const [ref, w] = useMeasure();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 46, padR = 12, padT = 14, padB = 24;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;
  const max = Math.max(...data) * 1.1;
  const gap = innerW / data.length;
  const bw = Math.min(gap * 0.6, 26);
  const ticks = 4;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {w > 0 && (
        <svg width={w} height={height} style={{ display: 'block' }} onMouseLeave={() => setHover(null)}>
          {Array.from({ length: ticks + 1 }).map((_, i) => {
            const gy = padT + (i / ticks) * innerH;
            const val = max - (i / ticks) * max;
            return (
              <g key={i}>
                <line x1={padL} y1={gy} x2={w - padR} y2={gy} stroke="var(--border)" strokeWidth="1" />
                <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)" className="t-mono">{fmt(val)}</text>
              </g>
            );
          })}
          {data.map((v, i) => {
            const bh = (v / max) * innerH;
            const bx = padL + i * gap + (gap - bw) / 2;
            const by = padT + innerH - bh;
            return (
              <rect
                key={i} x={bx} y={by} width={bw} height={bh} rx="3"
                fill={hover === i ? accent : 'var(--accent)'}
                opacity={hover == null || hover === i ? 1 : 0.45}
                onMouseEnter={() => setHover(i)}
                style={{ transition: 'opacity .12s' }}
              />
            );
          })}
          {labels && data.map((_, i) => (
            (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
              <text key={i} x={padL + i * gap + gap / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">{labels[i]}</text>
            )
          ))}
        </svg>
      )}
      {hover != null && (
        <div className="chart-tip" style={{ left: padL + hover * gap + gap / 2, top: padT + innerH - (data[hover] / max) * innerH, opacity: 1 }}>
          {labels && labels[hover] ? labels[hover] + ' · ' : ''}{fmt(data[hover])}
        </div>
      )}
    </div>
  );
}
