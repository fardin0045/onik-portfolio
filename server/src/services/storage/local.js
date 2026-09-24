import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Local-disk storage driver – intended for development only.
 * Most PaaS hosts have ephemeral disks, so use Cloudinary in production.
 */
export const UPLOAD_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../uploads');

const safeSegment = (s) => String(s).replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'general';

export const localDriver = {
  name: 'local',
  async upload(buffer, { folder, ext }) {
    const dir = path.join(UPLOAD_ROOT, safeSegment(folder));
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    await fs.writeFile(path.join(dir, fileName), buffer);
    const key = `${safeSegment(folder)}/${fileName}`;
    return { url: `/uploads/${key}`, key, resourceType: ext === 'pdf' ? 'raw' : 'image' };
  },
  async remove(key) {
    const target = path.resolve(UPLOAD_ROOT, key);
    // Path-traversal guard.
    if (!target.startsWith(UPLOAD_ROOT + path.sep)) return;
    await fs.rm(target, { force: true });
  },
};
