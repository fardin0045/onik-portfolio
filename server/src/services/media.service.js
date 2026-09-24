import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { Media } from '../models/Media.js';
import { badRequest } from '../utils/httpError.js';
import { driverFor, storage } from './storage/index.js';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

// SVG is intentionally NOT accepted: it can carry scripts (stored XSS).
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);
const ICON_MIME = new Set([...IMAGE_MIME, 'image/x-icon', 'image/vnd.microsoft.icon']);
const DOCUMENT_MIME = new Set(['application/pdf']);

export const ALLOWED_FOLDERS = ['general', 'profile', 'projects', 'blog', 'certifications', 'testimonials', 'branding', 'resume', 'logos'];

/**
 * Validates an uploaded buffer by its real content (magic bytes – never the
 * client-supplied mimetype/extension), optimises images and stores the file.
 */
export async function processAndStore(file, { folder = 'general', purpose = 'image', alt = '' } = {}) {
  if (!file?.buffer?.length) throw badRequest('No file uploaded');
  const safeFolder = ALLOWED_FOLDERS.includes(folder) ? folder : 'general';
  const detected = await fileTypeFromBuffer(file.buffer);
  const mime = detected?.mime;

  let buffer;
  let ext;
  let kind;
  let meta = {};

  if (mime && DOCUMENT_MIME.has(mime)) {
    if (file.buffer.length > MAX_DOCUMENT_BYTES) throw badRequest('PDF must be 10 MB or smaller');
    buffer = file.buffer;
    ext = 'pdf';
    kind = 'document';
  } else if (mime && (purpose === 'icon' ? ICON_MIME : IMAGE_MIME).has(mime)) {
    if (file.buffer.length > MAX_IMAGE_BYTES) throw badRequest('Image must be 8 MB or smaller');
    kind = 'image';
    if (mime.includes('icon')) {
      buffer = file.buffer;
      ext = 'ico';
    } else {
      try {
        // Re-encoding strips EXIF/GPS metadata and neutralises malformed files.
        const pipeline = sharp(file.buffer, { animated: mime === 'image/gif', limitInputPixels: 50_000_000 }).rotate();
        if (purpose === 'icon') {
          buffer = await pipeline.resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
          ext = 'png';
        } else {
          buffer = await pipeline.resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
          ext = 'webp';
        }
        const m = await sharp(buffer).metadata();
        meta = { width: m.width, height: m.height };
      } catch {
        throw badRequest('The image could not be processed. Please upload a valid image file.');
      }
    }
  } else {
    throw badRequest(
      purpose === 'document' ? 'Only PDF documents are allowed' : 'Unsupported file type. Allowed: JPG, PNG, WebP, AVIF, GIF (images) or PDF',
    );
  }

  if (purpose === 'document' && kind !== 'document') throw badRequest('Only PDF documents are allowed');

  const stored = await storage.upload(buffer, { folder: safeFolder, ext });
  const originalName = String(file.originalname || '').replace(/[^\w.\- ()]/g, '').slice(0, 160);
  return Media.create({
    url: stored.url,
    provider: storage.name,
    key: stored.key,
    resourceType: stored.resourceType,
    kind,
    mimeType: ext === 'pdf' ? 'application/pdf' : `image/${ext === 'ico' ? 'x-icon' : ext}`,
    size: buffer.length,
    ...meta,
    originalName,
    alt: String(alt).slice(0, 200),
    folder: safeFolder,
  });
}

export async function deleteMedia(media) {
  try {
    await driverFor(media.provider).remove(media.key, media.resourceType);
  } catch (err) {
    // Keep going – a missing remote file must not block removing the DB record.
    console.warn('Storage delete failed:', err?.message);
  }
  await media.deleteOne();
}
