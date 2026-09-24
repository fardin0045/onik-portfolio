/**
 * Zero-setup local development: starts an in-memory MongoDB, seeds it with the CV
 * content and runs the API. Data is lost when the process stops.
 *   npm run dev:memory
 * For persistent data use a real MONGODB_URI (local MongoDB or Atlas) with `npm run dev`.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri('portfolio');
console.log(`🧪 In-memory MongoDB running at ${process.env.MONGODB_URI}`);

const { connectDB } = await import('./config/db.js');
const { seed } = await import('./seed/seed.js');
const { createApp } = await import('./app.js');
const { env } = await import('./config/env.js');

await connectDB();
await seed();
createApp().listen(env.PORT, () => console.log(`🚀 API (in-memory DB) on http://localhost:${env.PORT}`));

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
