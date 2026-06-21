import { PROVIDERS } from '../../data';

interface LogoTileProps {
  provider: string;
  size?: number;
  radius?: string;
}

export function LogoTile({ provider, size = 38, radius }: LogoTileProps) {
  const p = PROVIDERS[provider] || { initial: '?', color: '#64748B' };
  return (
    <span
      className="logo-tile"
      style={{
        width: size,
        height: size,
        background: p.color,
        fontSize: size * 0.42,
        borderRadius: radius ?? 'var(--radius-sm)',
      }}
    >
      {p.initial}
    </span>
  );
}
