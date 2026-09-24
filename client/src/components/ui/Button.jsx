import { LoaderCircle } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '../../lib/utils.js';

const variants = {
  primary: 'bg-primary text-primary-fg hover:brightness-110 active:brightness-95 shadow-sm',
  secondary: 'border border-border-strong bg-surface text-fg hover:bg-surface-2',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110',
  outline: 'border border-border text-fg hover:border-primary hover:text-primary-ink',
};
const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[0.95rem] gap-2 rounded-xl',
  icon: 'h-9 w-9 rounded-lg',
};

/** Polymorphic button: renders <Link> for `to`, <a> for `href`, otherwise <button>. */
export function Button({ variant = 'primary', size = 'md', loading = false, className, children, to, href, disabled, ...props }) {
  const cls = cn(
    'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-200 select-none',
    'disabled:opacity-50 disabled:pointer-events-none',
    variants[variant],
    sizes[size],
    className,
  );
  const content = (
    <>
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
}
