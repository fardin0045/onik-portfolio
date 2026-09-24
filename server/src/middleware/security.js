import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { forbidden } from '../utils/httpError.js';

/** Recursively removes keys that start with `$` or contain `.` (NoSQL operator injection). */
function stripOperators(value, depth = 0) {
  if (depth > 20 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => stripOperators(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (k.startsWith('$') || k.includes('.') || k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    out[k] = stripOperators(v, depth + 1);
  }
  return out;
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = stripOperators(req.body);
  next();
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for cookie-authenticated requests.
 * Browsers cannot send a custom header cross-origin without a CORS pre-flight,
 * and our CORS policy only allows the configured origins. We additionally verify
 * the Origin header when present.
 */
export function csrfGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.get('X-Requested-With') !== 'XMLHttpRequest') return next(forbidden('Missing CSRF header'));
  const origin = req.get('Origin');
  if (origin && !isAllowedOrigin(origin, req)) return next(forbidden('Origin not allowed'));
  return next();
}

export function isAllowedOrigin(origin, req) {
  const clean = origin.replace(/\/$/, '');
  if (env.corsOrigins.includes(clean)) return true;
  // Same-origin requests (single-service deployment).
  if (req) {
    const self = `${req.protocol}://${req.get('host')}`;
    if (clean === self) return true;
  }
  return false;
}

const limiterDefaults = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: (_req, res) => res.status(429).json({ error: 'Too many requests, please try again later.' }),
};

export const apiLimiter = rateLimit({ ...limiterDefaults, windowMs: 60 * 1000, limit: 300 });
export const loginLimiter = rateLimit({ ...limiterDefaults, windowMs: 15 * 60 * 1000, limit: 10 });
export const refreshLimiter = rateLimit({ ...limiterDefaults, windowMs: 15 * 60 * 1000, limit: 60 });
export const contactLimiter = rateLimit({ ...limiterDefaults, windowMs: 60 * 60 * 1000, limit: 5 });
export const uploadLimiter = rateLimit({ ...limiterDefaults, windowMs: 60 * 60 * 1000, limit: 200 });
