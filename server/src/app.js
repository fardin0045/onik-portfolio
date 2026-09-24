import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { apiLimiter, csrfGuard, isAllowedOrigin, sanitizeBody } from './middleware/security.js';
import adminRoutes from './routes/admin/index.js';
import authRoutes from './routes/auth.routes.js';
import publicRoutes, { seoRouter } from './routes/public.routes.js';
import { renderIndexHtml } from './services/seo.service.js';
import { UPLOAD_ROOT } from './services/storage/local.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Needed behind Render/Railway/Heroku/Nginx so req.ip & secure cookies work.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'font-src': ["'self'", 'data:'],
          'connect-src': ["'self'"],
          'frame-src': ["'self'", 'https://res.cloudinary.com'],
          'object-src': ["'none'"],
          'frame-ancestors': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'upgrade-insecure-requests': env.isProd ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow the separately hosted frontend to load /uploads
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || isAllowedOrigin(origin)),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-Requested-With'],
      maxAge: 600,
    }),
  );

  app.use(compression());
  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use(sanitizeBody);

  /* ---------- API ---------- */
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
  app.use('/api', apiLimiter, csrfGuard);
  app.use('/api/auth', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  }, authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/admin', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  }, adminRoutes);
  app.use('/api', seoRouter); // /api/sitemap.xml & /api/robots.txt (for split deployments via rewrites)
  app.use('/api', notFoundHandler);

  /* ---------- Local uploads (development storage driver) ---------- */
  app.use(
    '/uploads',
    express.static(UPLOAD_ROOT, {
      maxAge: '365d',
      immutable: true, // file names are content-unique
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'),
    }),
  );

  /* ---------- SEO endpoints ---------- */
  app.use(seoRouter);

  /* ---------- Optional: serve the built React app (single-service deployment) ---------- */
  if (env.SERVE_CLIENT) {
    const dist = path.resolve(env.CLIENT_DIST_PATH || path.join(__dirname, '../../client/dist'));
    const indexPath = path.join(dist, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.warn(`⚠️  SERVE_CLIENT=true but ${indexPath} was not found. Run "npm run build" in /client.`);
    }
    app.use(
      '/assets',
      express.static(path.join(dist, 'assets'), { maxAge: '365d', immutable: true, index: false, fallthrough: false }),
    );
    app.use(express.static(dist, { index: false, maxAge: '1h' }));

    const KNOWN = [/^\/$/, /^\/projects\/[a-z0-9-]+\/?$/, /^\/blog\/?$/, /^\/blog\/[a-z0-9-]+\/?$/, /^\/admin(\/.*)?$/];
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') return next();
      try {
        const html = await renderIndexHtml(indexPath, req.path);
        if (req.path.startsWith('/admin')) res.set('X-Robots-Tag', 'noindex, nofollow');
        res
          .status(KNOWN.some((re) => re.test(req.path)) ? 200 : 404)
          .set('Cache-Control', 'no-cache')
          .type('html')
          .send(html);
      } catch (err) {
        next(err);
      }
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
