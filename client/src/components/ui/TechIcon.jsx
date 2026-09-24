import { Code2 } from 'lucide-react';
import { techIcon } from '../../lib/techIcons.js';
import { cn } from '../../lib/utils.js';

/**
 * Brand logo for a technology name. `colored` shows the brand colour permanently;
 * otherwise the logo is muted and takes its brand colour on hover of a `.group` parent.
 */
export function TechIcon({ name, className = 'size-4', colored = false, fallback = true }) {
  const match = techIcon(name);
  if (!match) return fallback ? <Code2 className={cn(className, 'text-subtle')} aria-hidden="true" /> : null;
  const { Icon, color } = match;
  return (
    <Icon
      aria-hidden="true"
      className={cn(className, 'shrink-0 transition-colors duration-300', !colored && color && 'text-muted group-hover:text-[var(--brand)]')}
      style={color ? { '--brand': color, ...(colored ? { color } : {}) } : undefined}
    />
  );
}

export const hasTechIcon = (name) => Boolean(techIcon(name));
