import fs from 'node:fs/promises';
import { env } from '../config/env.js';
import { Post, Project } from '../models/content.js';
import { cache } from './cache.js';
import { getSingleton } from './site.service.js';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function siteUrl() {
  const settings = await getSingleton('settings');
  return (settings.seo.siteUrl || env.publicSiteUrl).replace(/\/$/, '');
}

const absolute = (base, u) => (!u ? '' : /^https?:\/\//.test(u) ? u : `${base}${u.startsWith('/') ? '' : '/'}${u}`);

export async function buildSitemap() {
  const base = await siteUrl();
  const [projects, posts] = await Promise.all([
    Project.find({ isPublished: true }).select('slug updatedAt').lean(),
    Post.find({ isPublished: true, externalUrl: { $in: ['', null] } }).select('slug updatedAt').lean(),
  ]);
  const urls = [
    { loc: `${base}/`, priority: '1.0' },
    ...(posts.length ? [{ loc: `${base}/blog`, priority: '0.6' }] : []),
    ...projects.map((p) => ({ loc: `${base}/projects/${p.slug}`, lastmod: p.updatedAt, priority: '0.8' })),
    ...posts.map((p) => ({ loc: `${base}/blog/${p.slug}`, lastmod: p.updatedAt, priority: '0.6' })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}<priority>${u.priority}</priority></url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export async function buildRobots() {
  const [base, settings] = await Promise.all([siteUrl(), getSingleton('settings')]);
  if (!settings.seo.indexable) return 'User-agent: *\nDisallow: /\n';
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`;
}

/**
 * Injects SEO tags (title, description, Open Graph, Twitter, canonical, JSON-LD)
 * into the built index.html so crawlers and link-preview bots that do not run
 * JavaScript still see accurate metadata. Used only when SERVE_CLIENT=true.
 */
export async function renderIndexHtml(indexPath, pathname) {
  const key = `html:${pathname}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const [template, settings, profile, base] = await Promise.all([
    fs.readFile(indexPath, 'utf8'),
    getSingleton('settings'),
    getSingleton('profile'),
    siteUrl(),
  ]);

  let title = settings.seo.title || [profile.name, profile.title].filter(Boolean).join(' — ') || settings.general.siteTitle;
  let description = settings.seo.description || profile.shortIntro || '';
  let image = absolute(base, settings.seo.ogImage || profile.avatar?.url);
  let type = 'website';

  const m = pathname.match(/^\/(projects|blog)\/([a-z0-9-]+)\/?$/);
  if (m) {
    const Model = m[1] === 'projects' ? Project : Post;
    const doc = await Model.findOne({ slug: m[2], isPublished: true }).lean();
    if (doc) {
      title = `${doc.title} — ${profile.name}`;
      description = doc.shortDescription || doc.excerpt || description;
      image = absolute(base, doc.thumbnail?.url || doc.coverImage?.url) || image;
      type = 'article';
    }
  }

  const canonical = `${base}${pathname === '/' ? '/' : pathname.replace(/\/$/, '')}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title || undefined,
    description: profile.shortIntro || undefined,
    image: absolute(base, profile.avatar?.url) || undefined,
    url: base,
    email: profile.contact?.showEmail && profile.contact?.email ? `mailto:${profile.contact.email}` : undefined,
    address: profile.location ? { '@type': 'PostalAddress', addressLocality: profile.location } : undefined,
  };

  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    settings.seo.keywords.length ? `<meta name="keywords" content="${esc(settings.seo.keywords.join(', '))}" />` : '',
    `<meta name="robots" content="${settings.seo.indexable ? 'index, follow' : 'noindex, nofollow'}" />`,
    `<link rel="canonical" href="${esc(canonical)}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${esc(settings.general.siteTitle)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(canonical)}" />`,
    image ? `<meta property="og:image" content="${esc(image)}" />` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />`,
    settings.seo.twitterHandle ? `<meta name="twitter:site" content="${esc(settings.seo.twitterHandle)}" />` : '',
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    image ? `<meta name="twitter:image" content="${esc(image)}" />` : '',
    settings.general.favicon ? `<link rel="icon" href="${esc(settings.general.favicon)}" />` : '',
    `<meta name="theme-color" content="${esc(settings.theme.primaryColor)}" />`,
    // JSON.stringify + escaping "<" prevents breaking out of the script element.
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');

  const html = template.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, `<!-- seo:start -->\n    ${tags}\n    <!-- seo:end -->`);
  return cache.set(key, html);
}
