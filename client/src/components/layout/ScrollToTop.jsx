import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils.js';

export function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
      aria-label="Scroll to top"
      tabIndex={show ? 0 : -1}
      className={cn(
        'fixed right-4 bottom-4 z-40 inline-flex size-11 items-center justify-center rounded-xl border border-border bg-surface text-fg shadow-lg transition-all duration-300 hover:border-primary hover:text-primary-ink sm:right-6 sm:bottom-6',
        show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
