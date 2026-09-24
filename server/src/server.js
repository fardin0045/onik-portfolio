import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { ensureAdmin } from './seed/create-admin.js';

async function main() {
  await connectDB();
  // First deploy convenience: create the admin from ADMIN_EMAIL / ADMIN_PASSWORD if none exists yet.
  if (!(await User.exists({ role: 'admin' })) && env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
    await ensureAdmin({ quiet: true });
  } else if (!(await User.exists({ role: 'admin' }))) {
    console.warn('⚠️  No admin account yet. Set ADMIN_EMAIL and ADMIN_PASSWORD, then run `npm run seed` or restart.');
  }
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 API listening on http://localhost:${env.PORT} (${env.NODE_ENV}, storage: ${env.STORAGE_DRIVER})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received – shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
