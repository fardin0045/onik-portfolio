import { useEffect, useRef, useState } from 'react';

/**
 * Animates numeric values ("3.79", "12+", "95%") from 0 when they scroll into view.
 * Non-numeric values ("MERN") render unchanged. Respects reduced motion.
 */
export function CountUp({ value, duration = 1400 }) {
  const match = String(value).match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const ref = useRef(null);
  const [animate] = useState(
    () => Boolean(match) && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [display, setDisplay] = useState(animate ? `${match[1]}${(0).toFixed(match[2].split('.')[1]?.length || 0)}${match[3]}` : value);

  useEffect(() => {
    if (!animate) return undefined;
    const [, pre, num, post] = match;
    const target = Number(num);
    const decimals = num.split('.')[1]?.length || 0;
    const el = ref.current;
    let raf;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        setDisplay(`${pre}${(target * eased).toFixed(decimals)}${post}`);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, animate]);

  return (
    <span ref={ref} aria-label={String(value)}>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
