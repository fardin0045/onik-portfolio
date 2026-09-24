/**
 * One-time migration: local development database + local uploads  →  production (MongoDB Atlas + Cloudinary).
 *
 *   1. Every file in the source `media` collection that is stored locally (server/uploads/...) is uploaded
 *      with the TARGET storage driver (STORAGE_DRIVER=cloudinary).
 *   2. All content collections are copied to the target database, and every reference to an old
 *      `/uploads/...` URL (profile photo, CV, project images, markdown, settings…) is rewritten.
 *   3. `users` and `sessions` are NOT copied – the production admin is created from ADMIN_EMAIL /
 *      ADMIN_PASSWORD on the server's first boot (or run `npm run create-admin` against Atlas).
 *
 * Usage (from /server):
 *   cp .env.migrate.example .env.migrate   # fill in Atlas + Cloudinary values
 *   npm run migrate                        # refuses to overwrite a non-empty target
 *   npm run migrate -- --force             # replaces existing content in the target
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { ensureSrvResolvable } from '../config/db.js';
import { env } from '../config/env.js';
import { storage } from '../services/storage/index.js';
import { UPLOAD_ROOT } from '../services/storage/local.js';

const SOURCE_URI = process.env.SOURCE_MONGODB_URI;
const TARGET_URI = env.MONGODB_URI;
const force = process.argv.includes('--force');
const SKIP = new Set(['users', 'sessions']);

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!SOURCE_URI) fail('Set SOURCE_MONGODB_URI (your local database, e.g. mongodb://127.0.0.1:27017/portfolio).');
if (SOURCE_URI === TARGET_URI) fail('SOURCE_MONGODB_URI and MONGODB_URI are the same database.');
if (env.STORAGE_DRIVER !== 'cloudinary' && !process.env.MIGRATE_ALLOW_LOCAL) {
  fail('Set STORAGE_DRIVER=cloudinary (and the CLOUDINARY_* values) so files end up in cloud storage.');
}

await ensureSrvResolvable(TARGET_URI);
const source = await mongoose.createConnection(SOURCE_URI).asPromise();
const target = await mongoose.createConnection(TARGET_URI).asPromise();
console.log(`• Source: ${source.name} @ ${source.host}`);
console.log(`• Target: ${target.name} @ ${target.host}`);

const names = (await source.db.listCollections().toArray()).map((c) => c.name).filter((n) => !SKIP.has(n) && !n.startsWith('system.'));

// Safety: never silently overwrite production content.
const nonEmpty = [];
for (const name of names) {
  // eslint-disable-next-line no-await-in-loop
  if ((await target.db.collection(name).estimatedDocumentCount()) > 0) nonEmpty.push(name);
}
if (nonEmpty.length && !force) {
  fail(`Target already has data in: ${nonEmpty.join(', ')}.\n   Re-run with --force to replace it (npm run migrate -- --force).`);
}

/* ---------- 1. Files ---------- */
const urlMap = new Map(); // old URL -> new URL
const mediaDocs = names.includes('media') ? await source.db.collection('media').find().toArray() : [];
let uploaded = 0;
for (const m of mediaDocs) {
  if (m.provider !== 'local') continue;
  const file = path.resolve(UPLOAD_ROOT, m.key);
  if (!file.startsWith(UPLOAD_ROOT)) continue;
  let buffer;
  try {
    // eslint-disable-next-line no-await-in-loop
    buffer = await fs.readFile(file);
  } catch {
    console.warn(`   ⚠️  missing local file, skipped: ${m.key}`);
    continue;
  }
  // eslint-disable-next-line no-await-in-loop
  const stored = await storage.upload(buffer, { folder: m.folder || 'general', ext: path.extname(m.key).slice(1) });
  urlMap.set(m.url, stored.url);
  Object.assign(m, { url: stored.url, key: stored.key, provider: storage.name, resourceType: stored.resourceType });
  uploaded += 1;
  process.stdout.write(`\r• Uploading files… ${uploaded}`);
}
if (uploaded) process.stdout.write('\n');

/* ---------- 2. Documents (with URL rewriting) ---------- */
const replacements = [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length);
function rewrite(value) {
  if (typeof value === 'string') {
    let out = urlMap.get(value) ?? value;
    if (out === value && value.includes('/uploads/')) {
      for (const [from, to] of replacements) if (out.includes(from)) out = out.split(from).join(to); // e.g. images inside Markdown
    }
    return out;
  }
  if (Array.isArray(value)) return value.map(rewrite);
  if (value && typeof value === 'object' && !(value instanceof Date) && !value._bsontype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(v)]));
  }
  return value;
}

// A document still points at a local file if it contains an old URL (or, with cloud storage, any /uploads/ path).
const oldUrls = [...urlMap.keys()];
const stillLocal = (json) => (storage.name === 'local' ? oldUrls.some((u) => json.includes(u)) : json.includes('/uploads/'));
let unresolved = 0;
for (const name of names) {
  // eslint-disable-next-line no-await-in-loop
  const docs = name === 'media' ? mediaDocs : await source.db.collection(name).find().toArray();
  const rewritten = docs.map(rewrite);
  unresolved += rewritten.filter((d) => name !== 'media' && stillLocal(JSON.stringify(d))).length;
  const col = target.db.collection(name);
  // eslint-disable-next-line no-await-in-loop
  if (force) await col.deleteMany({});
  // eslint-disable-next-line no-await-in-loop
  if (rewritten.length) await col.insertMany(rewritten);
  console.log(`• ${name.padEnd(16)} ${docs.length} documents`);
}
if (unresolved) {
  console.warn(`   ⚠️  ${unresolved} document(s) still reference a local /uploads/ file that was not in the media library.`);
  console.warn('      Re-upload those images in the dashboard after going live.');
}

await source.close();
await target.close();
console.log(`\n✅ Migration complete: ${uploaded} files uploaded to ${storage.name}, ${names.length} collections copied.`);
console.log('   Next: open the live site → /admin, log in, check Website Settings → SEO → Website URL, then Publish.\n');
