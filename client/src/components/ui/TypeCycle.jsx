import { useEffect, useState } from 'react';

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Types each word, holds it, deletes it and moves on to the next one, forever.
 * Screen readers get the full list once; with reduced motion the first word is shown statically.
 */
export function TypeCycle({ words, typeMs = 75, deleteMs = 35, holdMs = 1800, className }) {
  const [reduced] = useState(prefersReducedMotion);
  const [{ i, n, deleting }, setState] = useState({ i: 0, n: 0, deleting: false });

  useEffect(() => {
    if (reduced || !words.length) return undefined;
    const word = words[i % words.length];
    const delay = deleting ? deleteMs : n === word.length ? holdMs : typeMs;
    const t = setTimeout(() => {
      setState((s) => {
        const w = words[s.i % words.length];
        if (!s.deleting) return s.n < w.length ? { ...s, n: s.n + 1 } : { ...s, deleting: true };
        return s.n > 0 ? { ...s, n: s.n - 1 } : { i: (s.i + 1) % words.length, n: 0, deleting: false };
      });
    }, delay);
    return () => clearTimeout(t);
  }, [i, n, deleting, words, reduced, typeMs, deleteMs, holdMs]);

  if (!words.length) return null;
  const shown = reduced ? words[0] : words[i % words.length].slice(0, n);

  return (
    <span className={className}>
      <span className="sr-only">{words.join(', ')}</span>
      <span aria-hidden="true">
        {shown}
        <span className="type-caret" />
      </span>
    </span>
  );
}
