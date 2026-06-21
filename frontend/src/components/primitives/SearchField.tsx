import type { CSSProperties } from 'react';
import { Icon } from './Icon';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

export function SearchField({ value, onChange, placeholder, style }: SearchFieldProps) {
  return (
    <div className="search-wrap" style={style}>
      <Icon name="search" />
      <input
        className="field"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
