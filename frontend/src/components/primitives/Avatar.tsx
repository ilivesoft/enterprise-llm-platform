interface AvatarProps {
  label: string;
  color?: string;
  size?: number;
}

export function Avatar({ label, color = 'var(--accent)', size = 32 }: AvatarProps) {
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.42,
      }}
    >
      {label}
    </span>
  );
}
