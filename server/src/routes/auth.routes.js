import { Router } from 'express';
import { z } from 'zod';
import { optionalAdmin, requireAdmin } from '../middleware/auth.js';
import { loginLimiter, refreshLimiter } from '../middleware/security.js';
import { validateBody } from '../middleware/validate.js';
import { Session } from '../models/Session.js';
import { dummyCompare, LOCK_MINUTES, MAX_FAILED_LOGINS, User } from '../models/User.js';
import {
  clearAuthCookies,
  createSession,
  REFRESH_COOKIE,
  revokeSessionByToken,
  rotateSession,
  setAuthCookies,
  signAccessToken,
} from '../services/auth.service.js';
import { HttpError, unauthorized } from '../utils/httpError.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid e-mail')),
  password: z.string().min(1, 'Password is required').max(200),
});

export const passwordPolicy = z
  .string()
  .min(12, 'Use at least 12 characters')
  .max(200)
  .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), 'Use upper-case, lower-case letters and a number');

const GENERIC_LOGIN_ERROR = 'Invalid e-mail or password';

router.post('/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash +failedLogins +lockUntil');

  if (!user) {
    await dummyCompare(password); // equalise timing -> no user enumeration
    throw unauthorized(GENERIC_LOGIN_ERROR);
  }
  if (user.isLocked()) {
    throw new HttpError(423, `Too many failed attempts. Try again in ${LOCK_MINUTES} minutes.`);
  }

  const ok = await user.verifyPassword(password);
  if (!ok) {
    user.failedLogins = (user.failedLogins || 0) + 1;
    if (user.failedLogins >= MAX_FAILED_LOGINS) {
      user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedLogins = 0;
    }
    await user.save();
    throw unauthorized(GENERIC_LOGIN_ERROR);
  }

  user.failedLogins = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  const { accessToken, refreshToken } = await createSession(user, req);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ user: user.toSafeJSON() });
});

router.post('/refresh', refreshLimiter, async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  // No session at all is a normal state (anonymous visitor), not an error.
  if (!raw) return res.json({ user: null });
  const rotated = await rotateSession(raw);
  if (!rotated) {
    clearAuthCookies(res);
    throw unauthorized('Session expired');
  }
  const user = await User.findById(rotated.session.user);
  if (!user) {
    clearAuthCookies(res);
    throw unauthorized('Session expired');
  }
  if (rotated.refreshToken) setAuthCookies(res, signAccessToken(user, rotated.session._id), rotated.refreshToken);
  return res.json({ user: user.toSafeJSON() });
});

router.post('/logout', async (req, res) => {
  await revokeSessionByToken(req.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(res);
  res.json({ ok: true });
});

/** Current admin, or `{ user: null }` when there is no valid access token (client then tries /refresh). */
router.get('/me', optionalAdmin, (req, res) => {
  res.json({ user: req.user ? req.user.toSafeJSON() : null });
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: passwordPolicy,
  })
  .refine((d) => d.currentPassword !== d.newPassword, { message: 'New password must be different', path: ['newPassword'] });

router.post('/change-password', requireAdmin, validateBody(changePasswordSchema), async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await user.verifyPassword(req.body.currentPassword))) {
    throw new HttpError(422, 'Validation failed', { currentPassword: 'Current password is incorrect' });
  }
  await user.setPassword(req.body.newPassword);
  user.tokenVersion += 1; // invalidates all outstanding access tokens
  await user.save();
  // Sign out every device (including this one), then open a fresh session for the current admin.
  await Session.updateMany({ user: user._id }, { $set: { revokedAt: new Date() } });
  const { accessToken, refreshToken } = await createSession(user, req);
  setAuthCookies(res, accessToken, refreshToken);
  res.json({ ok: true });
});

router.get('/sessions', requireAdmin, async (req, res) => {
  const sessions = await Session.find({ user: req.user._id, revokedAt: null, expiresAt: { $gt: new Date() } })
    .sort({ lastUsedAt: -1 })
    .select('userAgent lastUsedAt createdAt')
    .lean();
  res.json({
    items: sessions.map((s) => ({
      id: String(s._id),
      userAgent: s.userAgent,
      lastUsedAt: s.lastUsedAt,
      createdAt: s.createdAt,
      current: String(s._id) === req.sessionId,
    })),
  });
});

router.post('/logout-all', requireAdmin, async (req, res) => {
  await Session.updateMany({ user: req.user._id }, { $set: { revokedAt: new Date() } });
  req.user.tokenVersion += 1;
  await req.user.save();
  clearAuthCookies(res);
  res.json({ ok: true });
});

export default router;
