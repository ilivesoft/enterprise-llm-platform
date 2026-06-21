import type { CSSProperties } from 'react';

interface IconProps {
  name: string;
  size?: number;
  fill?: boolean;
  weight?: number;
  style?: CSSProperties;
  className?: string;
}

export function Icon({ name, size = 20, fill = false, weight = 400, style = {}, className = '' }: IconProps) {
  return (
    <span
      className={'material-symbols-outlined ' + className}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}`,
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
}
