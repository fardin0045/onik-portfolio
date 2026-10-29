import { useEffect, useState } from 'react';

const GLYPHS = '!<>-_\\/[]{}=+*^?#ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * "Decoding" text: starts as random code glyphs that resolve into the real text from left to right.
 * Screen readers get the plain text; with reduced motion the text is shown immediately.
 */
export function ScrambleText({ text, delay = 0, duration = 1200, className }) {
  const [reduced] = useState(prefersReducedMotion);
  const [shown, setShown] = useState(() => (reduced ? text : ''));

  useEffect(() => {
    if (reduced) return undefined;
    let raf;
    let start;
    const tick = (now) => {
      start ??= now;
      const t = Math.min(1, (now - start - delay) / duration);
      if (t < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const solved = Math.floor(t * text.length);
      setShown(
        [...text]
          .map((ch, i) => (i < solved || ch === ' ' ? ch : i < solved + 6 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : ''))
          .join(''),
      );
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, delay, duration, reduced]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {/* The invisible copy reserves the final width so the line never jumps while decoding. */}
      <span className="inline-grid" aria-hidden="true">
        <span className="invisible col-start-1 row-start-1">{text}</span>
        <span className="col-start-1 row-start-1">{shown}</span>
      </span>
    </span>
  );
}
