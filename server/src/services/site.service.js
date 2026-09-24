import { SiteDocument } from '../models/SiteDocument.js';
import { RESOURCES } from '../resources/registry.js';
import { parseOrThrow } from '../middleware/validate.js';
import { SINGLETONS } from '../validators/singletons.js';
import { notFound } from '../utils/httpError.js';
import { cache } from './cache.js';

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Deep merge used for PATCH semantics on singleton drafts (arrays are replaced, not merged). */
export function deepMerge(target, patch) {
  const out = { ...(target || {}) };
  for (const [k, v] of Object.entries(patch || {})) {
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

async function getDoc(key) {
  if (!SINGLETONS[key]) throw notFound();
  const doc = await SiteDocument.findOne({ key });
  if (doc) return doc;
  const empty = SINGLETONS[key].safeParse(key === 'profile' ? { name: 'Your Name' } : {});
  const data = empty.success ? empty.data : {};
  // Atomic upsert: concurrent first requests cannot create duplicates.
  return SiteDocument.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, draft: data, published: data, publishedAt: new Date(), autoCreated: true } },
    { upsert: true, new: true },
  );
}

/** Normalises stored data through the schema so newly added fields get their defaults. */
function normalise(key, data) {
  const r = SINGLETONS[key].safeParse(data || {});
  return r.success ? r.data : data;
}

export async function getSingleton(key, { draft = false } = {}) {
  const doc = await getDoc(key);
  return normalise(key, draft ? doc.draft : doc.published);
}

export async function updateSingletonDraft(key, patch) {
  const doc = await getDoc(key);
  const merged = deepMerge(normalise(key, doc.draft), patch);
  const clean = parseOrThrow(SINGLETONS[key], merged);
  doc.draft = clean;
  doc.autoCreated = false;
  doc.draftUpdatedAt = new Date();
  doc.markModified('draft');
  await doc.save();
  return clean;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export async function publishStatus() {
  const [profile, settings] = await Promise.all([getDoc('profile'), getDoc('settings')]);
  const status = (d) => ({
    hasChanges: !same(normalise(d.key, d.draft), normalise(d.key, d.published)),
    publishedAt: d.publishedAt,
    draftUpdatedAt: d.draftUpdatedAt,
  });
  return { profile: status(profile), settings: status(settings) };
}

export async function publishAll() {
  for (const key of Object.keys(SINGLETONS)) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await getDoc(key);
    doc.published = normalise(key, doc.draft);
    doc.publishedAt = new Date();
    doc.markModified('published');
    // eslint-disable-next-line no-await-in-loop
    await doc.save();
  }
  cache.invalidate();
  return publishStatus();
}

export async function discardDrafts() {
  for (const key of Object.keys(SINGLETONS)) {
    // eslint-disable-next-line no-await-in-loop
    const doc = await getDoc(key);
    doc.draft = doc.published;
    doc.draftUpdatedAt = new Date();
    doc.markModified('draft');
    // eslint-disable-next-line no-await-in-loop
    await doc.save();
  }
  return publishStatus();
}

/**
 * Everything the public home page needs, in one request.
 * preview=true (admin only) returns drafts and hidden items so changes can be reviewed before publishing.
 */
export async function getPublicSite({ preview = false } = {}) {
  const cacheKey = preview ? null : 'public-site';
  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit) return hit;
  }

  const [profile, settings, ...lists] = await Promise.all([
    getSingleton('profile', { draft: preview }),
    getSingleton('settings', { draft: preview }),
    ...Object.values(RESOURCES).map((r) => {
      const filter = preview ? {} : { isPublished: true };
      let q = r.model.find(filter).sort(r.publicSort || { order: 1, createdAt: 1 });
      if (r.publicProjection) q = q.select(r.publicProjection);
      if (r.publicLimit) q = q.limit(r.publicLimit);
      return q.lean({ virtuals: false }).then((rows) =>
        rows.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest })),
      );
    }),
  ]);

  // Respect privacy toggles: hidden contact details never leave the server.
  const publicProfile = preview ? profile : { ...profile, contact: { ...profile.contact } };
  if (!preview) {
    if (!profile.contact.showEmail) publicProfile.contact.email = '';
    if (!profile.contact.showPhone) publicProfile.contact.phone = '';
  }

  const payload = { profile: publicProfile, settings, preview, generatedAt: new Date().toISOString() };
  Object.values(RESOURCES).forEach((r, i) => {
    payload[r.publicKey] = lists[i];
  });
  payload.counts = { posts: await RESOURCES.posts.model.countDocuments(preview ? {} : { isPublished: true }) };
  return cacheKey ? cache.set(cacheKey, payload) : payload;
}
