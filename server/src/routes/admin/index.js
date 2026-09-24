import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { requireAdmin } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/security.js';
import { assertObjectId, parseOrThrow } from '../../middleware/validate.js';
import { Media } from '../../models/Media.js';
import { Message } from '../../models/Message.js';
import { RESOURCES } from '../../resources/registry.js';
import { invalidateOnWrite } from '../../services/cache.js';
import { ALLOWED_FOLDERS, deleteMedia, MAX_DOCUMENT_BYTES, processAndStore } from '../../services/media.service.js';
import { discardDrafts, getSingleton, publishAll, publishStatus, updateSingletonDraft } from '../../services/site.service.js';
import { badRequest, notFound } from '../../utils/httpError.js';
import { text } from '../../validators/common.js';
import { SINGLETONS } from '../../validators/singletons.js';
import { crudRouter } from './crud.routes.js';

const router = Router();

// Every route below requires a valid admin session – enforced server-side.
router.use(requireAdmin);
router.use(invalidateOnWrite);

/* ---------- Overview ---------- */
router.get('/overview', async (_req, res) => {
  const entries = await Promise.all(
    Object.entries(RESOURCES).map(async ([name, r]) => [
      name,
      { total: await r.model.countDocuments(), published: await r.model.countDocuments({ isPublished: true }) },
    ]),
  );
  const [unread, totalMessages, recentMessages, media, status] = await Promise.all([
    Message.countDocuments({ status: 'unread' }),
    Message.countDocuments(),
    Message.find({ status: { $ne: 'archived' } }).sort({ createdAt: -1 }).limit(5),
    Media.countDocuments(),
    publishStatus(),
  ]);
  res.json({
    counts: Object.fromEntries(entries),
    messages: { unread, total: totalMessages, recent: recentMessages.map((m) => m.toJSON()) },
    media,
    publish: status,
  });
});

/* ---------- Singletons (profile / settings) – draft editing ---------- */
router.param('singleton', (req, _res, next, key) => (Object.hasOwn(SINGLETONS, key) ? next() : next(notFound())));

router.get('/singletons/:singleton', async (req, res) => {
  res.json({ item: await getSingleton(req.params.singleton, { draft: true }) });
});

router.patch('/singletons/:singleton', async (req, res) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw badRequest('Expected an object');
  res.json({ item: await updateSingletonDraft(req.params.singleton, req.body) });
});

/* ---------- Publishing workflow ---------- */
router.get('/publish', async (_req, res) => res.json(await publishStatus()));
router.post('/publish', async (_req, res) => res.json(await publishAll()));
router.post('/publish/discard', async (_req, res) => res.json(await discardDrafts()));

/* ---------- Media library ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1, fields: 10 },
});

const uploadMetaSchema = z
  .object({
    folder: z.enum(ALLOWED_FOLDERS).optional(),
    purpose: z.enum(['image', 'icon', 'document']).optional(),
    alt: text(200).optional(),
  })
  .strict();

router.post('/media', uploadLimiter, upload.single('file'), async (req, res) => {
  const meta = parseOrThrow(uploadMetaSchema, req.body || {});
  const media = await processAndStore(req.file, meta);
  res.status(201).json({ item: media.toJSON() });
});

router.get('/media', async (req, res) => {
  const filter = {};
  if (['image', 'document'].includes(req.query.kind)) filter.kind = req.query.kind;
  if (ALLOWED_FOLDERS.includes(req.query.folder)) filter.folder = req.query.folder;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = 48;
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Media.countDocuments(filter),
  ]);
  res.json({ items: items.map((m) => m.toJSON()), page, pages: Math.max(1, Math.ceil(total / limit)), total });
});

router.patch('/media/:id', async (req, res) => {
  const { alt } = parseOrThrow(z.object({ alt: text(200) }).strict(), req.body);
  const media = await Media.findByIdAndUpdate(assertObjectId(req.params.id), { alt }, { new: true });
  if (!media) throw notFound();
  res.json({ item: media.toJSON() });
});

router.delete('/media/:id', async (req, res) => {
  const media = await Media.findById(assertObjectId(req.params.id));
  if (!media) throw notFound();
  await deleteMedia(media);
  res.json({ ok: true });
});

/* ---------- Contact messages ---------- */
router.get('/messages', async (req, res) => {
  const filter = {};
  if (['unread', 'read', 'archived'].includes(req.query.status)) filter.status = req.query.status;
  else filter.status = { $ne: 'archived' };
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = 25;
  const [items, total, unread] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Message.countDocuments(filter),
    Message.countDocuments({ status: 'unread' }),
  ]);
  res.json({ items: items.map((m) => m.toJSON()), page, pages: Math.max(1, Math.ceil(total / limit)), total, unread });
});

router.patch('/messages/:id', async (req, res) => {
  const { status } = parseOrThrow(z.object({ status: z.enum(['unread', 'read', 'archived']) }).strict(), req.body);
  const msg = await Message.findByIdAndUpdate(assertObjectId(req.params.id), { status }, { new: true });
  if (!msg) throw notFound();
  res.json({ item: msg.toJSON() });
});

router.delete('/messages/:id', async (req, res) => {
  const msg = await Message.findByIdAndDelete(assertObjectId(req.params.id));
  if (!msg) throw notFound();
  res.json({ ok: true });
});

/* ---------- Collections (generic CRUD) ---------- */
router.use('/', crudRouter());

export default router;
