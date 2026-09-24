import { Router } from 'express';
import { z } from 'zod';
import { optionalAdmin } from '../middleware/auth.js';
import { contactLimiter } from '../middleware/security.js';
import { validateBody } from '../middleware/validate.js';
import { Post, Project } from '../models/content.js';
import { Message } from '../models/Message.js';
import { hmac } from '../services/auth.service.js';
import { notifyNewMessage } from '../services/mail.service.js';
import { buildRobots, buildSitemap } from '../services/seo.service.js';
import { getPublicSite, getSingleton } from '../services/site.service.js';
import { badRequest, notFound } from '../utils/httpError.js';
import { email, requiredText, text } from '../validators/common.js';

const router = Router();

const clean = ({ _id, __v, ...rest }) => ({ id: String(_id), ...rest });
const wantsPreview = (req) => req.query.preview === '1' && Boolean(req.user);

/** Revalidate on every request; unchanged content is answered with a cheap 304 (ETag). */
const noCache = (res) => res.set('Cache-Control', 'no-cache');
const privateNoStore = (res) => res.set('Cache-Control', 'private, no-store');

router.get('/site', optionalAdmin, async (req, res) => {
  const preview = wantsPreview(req);
  if (req.query.preview === '1' && !req.user) return res.status(401).json({ error: 'Log in to preview drafts' });
  const data = await getPublicSite({ preview });
  preview ? privateNoStore(res) : noCache(res);
  return res.json(data);
});

const slugParam = (s) => {
  if (!/^[a-z0-9-]{1,80}$/.test(s)) throw notFound();
  return s;
};

router.get('/projects/:slug', optionalAdmin, async (req, res) => {
  const preview = wantsPreview(req);
  const filter = { slug: slugParam(req.params.slug), ...(preview ? {} : { isPublished: true }) };
  const project = await Project.findOne(filter).lean();
  if (!project) throw notFound('Project not found');
  const siblings = await Project.find(preview ? {} : { isPublished: true })
    .sort({ order: 1, createdAt: 1 })
    .select('slug title')
    .lean();
  const i = siblings.findIndex((p) => p.slug === project.slug);
  preview ? privateNoStore(res) : noCache(res);
  res.json({
    item: clean(project),
    prev: i > 0 ? clean(siblings[i - 1]) : null,
    next: i >= 0 && i < siblings.length - 1 ? clean(siblings[i + 1]) : null,
  });
});

router.get('/posts', optionalAdmin, async (req, res) => {
  const preview = wantsPreview(req);
  const page = Math.max(1, Math.min(1000, Number.parseInt(req.query.page, 10) || 1));
  const limit = 12;
  const filter = preview ? {} : { isPublished: true };
  const tag = typeof req.query.tag === 'string' ? req.query.tag.slice(0, 60) : '';
  if (tag) filter.tags = tag;
  const [items, total] = await Promise.all([
    Post.find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-content').lean(),
    Post.countDocuments(filter),
  ]);
  preview ? privateNoStore(res) : noCache(res);
  res.json({ items: items.map(clean), page, pages: Math.max(1, Math.ceil(total / limit)), total });
});

router.get('/posts/:slug', optionalAdmin, async (req, res) => {
  const preview = wantsPreview(req);
  const post = await Post.findOne({ slug: slugParam(req.params.slug), ...(preview ? {} : { isPublished: true }) }).lean();
  if (!post) throw notFound('Article not found');
  preview ? privateNoStore(res) : noCache(res);
  res.json({ item: clean(post) });
});

const contactSchema = z
  .object({
    name: requiredText(100, 'Name').pipe(z.string().min(2, 'Name is too short')),
    email: email(),
    subject: requiredText(150, 'Subject').pipe(z.string().min(3, 'Subject is too short')),
    message: requiredText(5000, 'Message').pipe(z.string().min(10, 'Message is too short')),
    // Anti-spam: honeypot must stay empty; form must have been open for a few seconds.
    website: text(200).optional(),
    startedAt: z.coerce.number().optional(),
  })
  .strict();

router.post('/contact', contactLimiter, validateBody(contactSchema), async (req, res) => {
  const profile = await getSingleton('profile');
  if (!profile.contact.formEnabled) throw badRequest('The contact form is currently disabled');

  const { website, startedAt, ...data } = req.body;
  const tooFast = startedAt && Date.now() - startedAt < 3000;
  const linkSpam = (data.message.match(/https?:\/\//g) || []).length > 5;
  if (website || tooFast || linkSpam) {
    // Pretend success so bots learn nothing.
    return res.status(201).json({ ok: true });
  }

  const msg = await Message.create({
    ...data,
    ipHash: hmac(req.ip || ''),
    userAgent: String(req.get('user-agent') || '').slice(0, 300),
  });
  notifyNewMessage(msg);
  return res.status(201).json({ ok: true });
});

export const seoRouter = Router();
seoRouter.get('/sitemap.xml', async (_req, res) => {
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(await buildSitemap());
});
seoRouter.get('/robots.txt', async (_req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(await buildRobots());
});

export default router;
