import { httpMethodColors } from '../../styles/theme';
import './MethodBadge.css';

interface MethodBadgeProps {
  method: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MethodBadge({ method, size = 'md' }: MethodBadgeProps) {
  const colors = httpMethodColors[method] || { bg: '#5D52EC', text: '#fff' };

  return (
    <span
      className={`method-badge method-badge-${size}`}
      style={{ background: colors.bg, color: colors.text }}
    >
      {method}
    </span>
  );
}
