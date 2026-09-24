import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Set();
const current = () => document.documentElement.getAttribute('data-theme') || 'dark';

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  listeners.forEach((l) => l());
}

/** Applies the site's default theme unless the visitor chose one explicitly. */
export function applyDefaultTheme(def = 'dark') {
  try {
    localStorage.setItem('theme-default', def);
    if (localStorage.getItem('theme')) return;
  } catch {
    /* storage unavailable */
  }
  const resolved = def === 'system' ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : def;
  if (resolved !== current()) apply(resolved);
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    current,
    () => 'dark',
  );
  const toggle = useCallback(() => {
    const next = current() === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
    apply(next);
  }, []);
  return { theme, toggle };
}
