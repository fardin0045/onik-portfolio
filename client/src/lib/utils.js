import clsx from 'clsx';
import { API_URL } from './api.js';

export const cn = (...args) => clsx(...args);

/** Resolves a stored media URL. Locally stored files (/uploads/...) live on the API origin. */
export function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
  return url;
}

const CLOUDINARY_RE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

/** Returns an optimised, resized URL (Cloudinary transformations: auto format + quality). */
export function imageUrl(url, width) {
  const resolved = mediaUrl(url);
  const m = resolved.match(CLOUDINARY_RE);
  if (!m) return resolved;
  return `${m[1]}f_auto,q_auto,c_limit,w_${width}/${m[2]}`;
}

export function imageSrcSet(url, widths = [480, 800, 1200, 1600]) {
  if (!CLOUDINARY_RE.test(mediaUrl(url))) return undefined;
  return widths.map((w) => `${imageUrl(url, w)} ${w}w`).join(', ');
}

/** Picks black or white text for a given background colour (WCAG contrast). */
export function readableOn(hex = '#5b8cff') {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? '#0b0d12' : '#ffffff';
}

export const isExternal = (url = '') => /^https?:\/\//.test(url);

export function formatDate(value, opts = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  // toLocaleDateString rejects time options, so use toLocaleString when a time is requested.
  return 'timeStyle' in opts || 'hour' in opts ? d.toLocaleString(undefined, opts) : d.toLocaleDateString(undefined, opts);
}

export const dateRange = (start, end, current) => [start, current ? 'Present' : end].filter(Boolean).join(' — ');

export function readingTime(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const k = (typeof key === 'function' ? key(item) : item[key]) || 'Other';
    (acc[k] ||= []).push(item);
    return acc;
  }, {});
}
