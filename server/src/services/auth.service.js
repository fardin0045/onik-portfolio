import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models/Session.js';

export const ACCESS_COOKIE = 'pf_access';
export const REFRESH_COOKIE = 'pf_refresh';
const JWT_OPTS = { issuer: 'portfolio-api', audience: 'portfolio-admin', algorithm: 'HS256' };

export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const hmac = (value) => crypto.createHmac('sha256', env.JWT_SECRET).update(String(value)).digest('hex');

export function signAccessToken(user, sessionId) {
  return jwt.sign({ sub: String(user._id), sid: String(sessionId), tv: user.tokenVersion, role: user.role }, env.JWT_SECRET, {
    ...JWT_OPTS,
    expiresIn: `${env.ACCESS_TOKEN_TTL_MIN}m`,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { ...JWT_OPTS, algorithms: ['HS256'] });
}

const baseCookie = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.COOKIE_SAMESITE,
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
});

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, { ...baseCookie(), path: '/api', maxAge: env.ACCESS_TOKEN_TTL_MIN * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...baseCookie(), path: '/api/auth', maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400 * 1000 });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie(), path: '/api' });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie(), path: '/api/auth' });
}

const REUSE_GRACE_MS = 30 * 1000;
const newRefreshToken = () => crypto.randomBytes(48).toString('base64url');
const refreshExpiry = () => new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400 * 1000);

/** Creates a new session and returns the raw tokens (raw refresh token is never stored). */
export async function createSession(user, req) {
  const refreshToken = newRefreshToken();
  const session = await Session.create({
    user: user._id,
    tokenHash: sha256(refreshToken),
    userAgent: String(req.get('user-agent') || '').slice(0, 300),
    ip: hmac(req.ip || ''),
    expiresAt: refreshExpiry(),
  });
  return { session, refreshToken, accessToken: signAccessToken(user, session._id) };
}

/**
 * Rotates a refresh token. If a token that was already rotated is presented again
 * (a sign of theft), the whole session is revoked.
 */
export async function rotateSession(rawRefreshToken) {
  const hash = sha256(rawRefreshToken);
  const session = await Session.findOne({ tokenHash: hash });
  if (!session) {
    const reused = await Session.findOne({ previousTokenHash: hash });
    if (reused && !reused.revokedAt) {
      // Two tabs refreshing at the same time: the other tab already rotated the token and the
      // browser holds the new cookies. Confirm the session without issuing new tokens.
      if (Date.now() - reused.lastUsedAt.getTime() < REUSE_GRACE_MS && reused.expiresAt > new Date()) {
        return { session: reused, refreshToken: null };
      }
      // Otherwise an old token was replayed – likely stolen. Kill the session.
      reused.revokedAt = new Date();
      await reused.save();
    }
    return null;
  }
  if (session.revokedAt || session.expiresAt < new Date()) return null;

  const refreshToken = newRefreshToken();
  session.previousTokenHash = session.tokenHash;
  session.tokenHash = sha256(refreshToken);
  session.lastUsedAt = new Date();
  session.expiresAt = refreshExpiry();
  await session.save();
  return { session, refreshToken };
}

export async function revokeSessionByToken(rawRefreshToken) {
  if (!rawRefreshToken) return;
  await Session.updateOne({ tokenHash: sha256(rawRefreshToken) }, { $set: { revokedAt: new Date() } });
}
