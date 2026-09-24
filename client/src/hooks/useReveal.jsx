import { useEffect, useRef } from 'react';

/** Adds a subtle fade/slide-in when the element scrolls into view (respects reduced motion via CSS). */
export function useReveal({ delay = 0 } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.classList.add('reveal');
    if (delay) el.style.setProperty('--reveal-delay', `${delay}ms`);
    if (!('IntersectionObserver' in window)) {
      el.dataset.visible = 'true';
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.visible = 'true';
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return ref;
}

export function Reveal({ as: Tag = 'div', delay = 0, children, ...props }) {
  const ref = useReveal({ delay });
  return (
    <Tag ref={ref} {...props}>
      {children}
    </Tag>
  );
}
