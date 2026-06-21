import { useState, useRef, useLayoutEffect } from 'react';

interface AreaChartProps {
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

function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function AreaChart({ data, height = 240, fmt = v => String(v), labels, accent = 'var(--accent)' }: AreaChartProps) {
  const [ref, w] = useMeasure();
  const [hover, setHover] = useState<number | null>(null);
  const padL = 46, padR = 12, padT = 14, padB = 24;
  const innerW = Math.max(0, w - padL - padR);
  const innerH = height - padT - padB;
  const max = Math.max(...data) * 1.08;
  const min = Math.min(...data) * 0.92;
  const x = (i: number) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - ((v - min) / (max - min)) * innerH;
  const pts: [number, number][] = data.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  const area = line + ` L ${x(data.length - 1)},${padT + innerH} L ${x(0)},${padT + innerH} Z`;
  const ticks = 4;
  const gid = 'ag' + Math.round(max);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let idx = Math.round(((mx - padL) / innerW) * (data.length - 1));
    idx = Math.max(0, Math.min(data.length - 1, idx));
    setHover(idx);
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {w > 0 && (
        <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block' }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {Array.from({ length: ticks + 1 }).map((_, i) => {
            const gy = padT + (i / ticks) * innerH;
            const val = max - (i / ticks) * (max - min);
            return (
              <g key={i}>
                <line x1={padL} y1={gy} x2={w - padR} y2={gy} stroke="var(--border)" strokeWidth="1" />
                <text x={padL - 8} y={gy + 4} textAnchor="end" fontSize="10.5" fill="var(--muted)" className="t-mono">{fmt(val)}</text>
              </g>
            );
          })}
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" />
          {hover != null && (
            <g>
              <line x1={x(hover)} y1={padT} x2={x(hover)} y2={padT + innerH} stroke="var(--border-strong)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={x(hover)} cy={y(data[hover])} r="4.5" fill={accent} stroke="var(--surface)" strokeWidth="2" />
            </g>
          )}
          {labels && data.map((_, i) => (
            (i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
              <text key={i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">{labels[i]}</text>
            )
          ))}
        </svg>
      )}
      {hover != null && (
        <div className="chart-tip" style={{ left: x(hover), top: y(data[hover]), opacity: 1 }}>
          {labels && labels[hover] ? labels[hover] + ' · ' : ''}{fmt(data[hover])}
        </div>
      )}
    </div>
  );
}
