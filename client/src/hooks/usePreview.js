import { useSyncExternalStore } from 'react';

/**
 * Draft preview mode. Entered with `?preview=1` (the dashboard's "Preview" button),
 * kept for the browser tab session so in-site navigation stays in preview.
 */
const KEY = 'portfolio-preview';
const listeners = new Set();

function read() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('preview') === '1') sessionStorage.setItem(KEY, '1');
    if (params.get('preview') === '0') sessionStorage.removeItem(KEY);
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function exitPreview() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('preview');
  window.history.replaceState(null, '', url);
  listeners.forEach((l) => l());
}

export function usePreview() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => false,
  );
}
