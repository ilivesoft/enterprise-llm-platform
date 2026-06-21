import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { useLang, L } from '../../contexts/LangContext';
import { STATUS } from '../../data';
import type { ServiceStatus } from '../../types';

interface BadgeProps {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'error';
  dot?: string;
  icon?: string;
  children?: ReactNode;
}

export function Badge({ variant = 'neutral', dot, icon, children }: BadgeProps) {
  return (
    <span className={'badge badge-' + variant}>
      {dot && <span className="dot" style={{ background: dot }} />}
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: ServiceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const lang = useLang();
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span className={'badge ' + s.cls}>
      <span className="dot" style={{ background: s.dot }} />
      {L(s, lang)}
    </span>
  );
}
