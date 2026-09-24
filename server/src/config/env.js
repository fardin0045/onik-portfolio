import { z } from 'zod';

/**
 * Centralised, validated environment configuration.
 * The process refuses to start with an invalid/insecure configuration.
 */
const bool = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  // Comma separated list of allowed browser origins (frontend URLs).
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_SECURE: bool.optional(),
  COOKIE_DOMAIN: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  // Public URL of the website (used for sitemap/canonical defaults).
  PUBLIC_SITE_URL: z.string().default('http://localhost:5173'),
  // When true the API also serves the built React app (single-service deploy).
  SERVE_CLIENT: bool.default(false),
  CLIENT_DIST_PATH: z.string().optional(),

  STORAGE_DRIVER: z.enum(['cloudinary', 'local']).default('local'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('portfolio'),

  // Optional e-mail notifications for new contact messages.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: bool.optional(),
  MAIL_FROM: z.string().optional(),
  NOTIFY_EMAIL: z.string().optional(),

  // Used only by the seed / create-admin scripts.
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

const e = parsed.data;
const isProd = e.NODE_ENV === 'production';

if (isProd && e.STORAGE_DRIVER === 'cloudinary' && !(e.CLOUDINARY_CLOUD_NAME && e.CLOUDINARY_API_KEY && e.CLOUDINARY_API_SECRET)) {
  console.error('❌ STORAGE_DRIVER=cloudinary requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET');
  process.exit(1);
}
if (isProd && /change-me|example|secret123/i.test(e.JWT_SECRET)) {
  console.error('❌ JWT_SECRET looks like a placeholder. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

export const env = {
  ...e,
  isProd,
  isTest: e.NODE_ENV === 'test',
  corsOrigins: e.CORS_ORIGINS.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean),
  cookieSecure: e.COOKIE_SECURE ?? (isProd || e.COOKIE_SAMESITE === 'none'),
  publicSiteUrl: e.PUBLIC_SITE_URL.replace(/\/$/, ''),
};
