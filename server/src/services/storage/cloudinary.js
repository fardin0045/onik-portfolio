import crypto from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

/**
 * Cloudinary storage driver. Images are uploaded already optimised (WebP) and
 * served from Cloudinary's CDN; PDFs are stored as `raw` resources so they are
 * downloadable without enabling PDF delivery on the account.
 */
export const cloudinaryDriver = {
  name: 'cloudinary',
  upload(buffer, { folder, ext }) {
    ensureConfigured();
    const resourceType = ext === 'pdf' ? 'raw' : 'image';
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
          resource_type: resourceType,
          // raw files need the extension in the public id to be served with the right type.
          ...(resourceType === 'raw'
            ? { public_id: `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}` }
            : { unique_filename: true }),
          overwrite: false,
        },
        (err, result) => {
          if (err) return reject(err);
          return resolve({ url: result.secure_url, key: result.public_id, resourceType });
        },
      );
      stream.end(buffer);
    });
  },
  async remove(key, resourceType = 'image') {
    ensureConfigured();
    await cloudinary.uploader.destroy(key, { resource_type: resourceType, invalidate: true });
  },
};
