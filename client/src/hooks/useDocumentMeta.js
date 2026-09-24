import { useEffect } from 'react';
import { imageUrl } from '../lib/utils.js';

function upsert(selector, create, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

const meta = (attr, key, content) => {
  if (content === undefined) return;
  upsert(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute(attr, key);
    return m;
  }, { content: content || '' });
};

/**
 * Keeps <title>, description, canonical, Open Graph / Twitter tags and JSON-LD in sync
 * with the current page. (For crawlers that do not execute JS, the server injects the
 * same tags into index.html – see server/src/services/seo.service.js.)
 */
export function useDocumentMeta({ title, description, image, url, type = 'website', siteName, jsonLd, noindex } = {}) {
  // Escape '<' so the JSON can never close the <script> element early.
  const ld = jsonLd ? JSON.stringify(jsonLd).replaceAll('<', '\\' + 'u003c') : '';
  useEffect(() => {
    if (title) document.title = title;
    meta('name', 'description', description);
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:type', type);
    meta('property', 'og:site_name', siteName);
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', description);
    if (image) {
      const abs = new URL(imageUrl(image, 1200), window.location.origin).href;
      meta('property', 'og:image', abs);
      meta('name', 'twitter:image', abs);
      meta('name', 'twitter:card', 'summary_large_image');
    }
    meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    const canonical = url || window.location.origin + window.location.pathname;
    upsert('link[rel="canonical"]', () => {
      const l = document.createElement('link');
      l.rel = 'canonical';
      return l;
    }, { href: canonical });
    meta('property', 'og:url', canonical);

    let script;
    if (ld) {
      // Server-injected JSON-LD is replaced by the page-specific one.
      document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, image, url, type, siteName, noindex, ld]);
}
