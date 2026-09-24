/**
 * Creates the administrator account from ADMIN_EMAIL / ADMIN_PASSWORD (env) if it does not exist.
 *   npm run create-admin
 *   npm run create-admin -- --reset   (resets the password of that account to ADMIN_PASSWORD)
 * After the first login, change the password in Dashboard → Account and remove ADMIN_PASSWORD from the env.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { passwordPolicy } from '../routes/auth.routes.js';

export async function ensureAdmin({ quiet = false, reset = false } = {}) {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  const existing = email ? await User.findOne({ email }) : await User.findOne({ role: 'admin' });

  if (existing && !reset) {
    if (!quiet) console.log(`• Admin already exists (${existing.email})`);
    return existing;
  }
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env to create the admin account.');
  }
  const check = passwordPolicy.safeParse(password);
  if (!check.success) throw new Error(`ADMIN_PASSWORD is too weak: ${check.error.issues[0].message}`);

  const user = existing || new User({ email, name: env.ADMIN_NAME || 'Administrator', role: 'admin' });
  await user.setPassword(password);
  if (existing) user.tokenVersion += 1;
  await user.save();
  console.log(`• Admin ${existing ? 'password reset' : 'created'}: ${email}`);
  return user;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  connectDB()
    .then(() => ensureAdmin({ reset: process.argv.includes('--reset') }))
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    })
    .finally(() => disconnectDB());
}
