import { Router } from 'express';
import { z } from 'zod';
import { assertObjectId, parseOrThrow } from '../../middleware/validate.js';
import { RESOURCES } from '../../resources/registry.js';
import { notFound } from '../../utils/httpError.js';
import { uniqueSlug } from '../../utils/slug.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const reorderSchema = z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(1000) }).strict();

/**
 * Generic, registry-driven CRUD for every admin-managed collection:
 *   GET    /api/admin/:resource           list (?q= search, ?type= filter for experience)
 *   GET    /api/admin/:resource/:id       read one
 *   POST   /api/admin/:resource           create
 *   PATCH  /api/admin/:resource/:id       partial update
 *   DELETE /api/admin/:resource/:id       delete
 *   PUT    /api/admin/:resource/reorder   { ids: [...] } -> sets `order` by position
 */
export function crudRouter() {
  const router = Router();

  router.param('resource', (req, _res, next, name) => {
    const def = Object.hasOwn(RESOURCES, name) ? RESOURCES[name] : null;
    if (!def) return next(notFound('Unknown resource'));
    req.resource = def;
    return next();
  });

  router.get('/:resource', async (req, res) => {
    const { model, searchFields = [] } = req.resource;
    const filter = {};
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    if (q) filter.$or = searchFields.map((f) => ({ [f]: { $regex: escapeRegex(q), $options: 'i' } }));
    if (req.params.resource === 'experience' && ['work', 'internship'].includes(req.query.type)) filter.type = req.query.type;
    const items = await model.find(filter).sort({ order: 1, createdAt: 1 }).limit(500);
    res.json({ items: items.map((d) => d.toJSON()) });
  });

  router.put('/:resource/reorder', async (req, res) => {
    const { ids } = parseOrThrow(reorderSchema, req.body);
    await req.resource.model.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));
    res.json({ ok: true });
  });

  router.get('/:resource/:id', async (req, res) => {
    const doc = await req.resource.model.findById(assertObjectId(req.params.id));
    if (!doc) throw notFound();
    res.json({ item: doc.toJSON() });
  });

  router.post('/:resource', async (req, res) => {
    const { model, schema, slugFrom } = req.resource;
    const data = parseOrThrow(schema, req.body);
    if (slugFrom) data.slug = await uniqueSlug(model, data.slug || data[slugFrom]);
    if (data.order === undefined) {
      const last = await model.findOne().sort({ order: -1 }).select('order').lean();
      data.order = (last?.order ?? -1) + 1;
    }
    const doc = await model.create(data);
    res.status(201).json({ item: doc.toJSON() });
  });

  router.patch('/:resource/:id', async (req, res) => {
    const { model, schema, slugFrom } = req.resource;
    const id = assertObjectId(req.params.id);
    const data = parseOrThrow(schema.partial(), req.body);
    const doc = await model.findById(id);
    if (!doc) throw notFound();
    if (slugFrom && (data.slug !== undefined || data[slugFrom] !== undefined)) {
      const base = data.slug || doc.slug || data[slugFrom] || doc[slugFrom];
      data.slug = await uniqueSlug(model, base, doc._id);
    }
    doc.set(data);
    await doc.save();
    res.json({ item: doc.toJSON() });
  });

  router.delete('/:resource/:id', async (req, res) => {
    const doc = await req.resource.model.findByIdAndDelete(assertObjectId(req.params.id));
    if (!doc) throw notFound();
    res.json({ ok: true });
  });

  return router;
}
