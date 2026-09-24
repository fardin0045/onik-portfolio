import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../services/auth.service.js';
import { forbidden, unauthorized } from '../utils/httpError.js';

/** Resolves the admin from the access-token cookie. Returns null when not authenticated. */
async function resolveAdmin(req) {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) return null;
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return null;
  }
  const [user, session] = await Promise.all([
    User.findById(payload.sub),
    Session.findById(payload.sid).select('revokedAt expiresAt user').lean(),
  ]);
  if (!user || !session) return null;
  // Revoked session, password changed since issue, or token/session mismatch -> reject.
  if (session.revokedAt || session.expiresAt < new Date()) return null;
  if (String(session.user) !== String(user._id) || payload.tv !== user.tokenVersion) return null;
  return { user, sessionId: String(session._id) };
}

/** Blocks the request unless a valid admin session is present (server-side authorization). */
export async function requireAdmin(req, _res, next) {
  const auth = await resolveAdmin(req);
  if (!auth) return next(unauthorized());
  if (auth.user.role !== 'admin') return next(forbidden());
  req.user = auth.user;
  req.sessionId = auth.sessionId;
  return next();
}

/** Attaches req.user when authenticated, never blocks (used for draft preview). */
export async function optionalAdmin(req, _res, next) {
  const auth = await resolveAdmin(req);
  if (auth?.user.role === 'admin') {
    req.user = auth.user;
    req.sessionId = auth.sessionId;
  }
  next();
}
