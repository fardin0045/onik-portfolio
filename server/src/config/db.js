import mongoose from 'mongoose';
import { env } from './env.js';

// NoSQL-injection defence: every request body is validated by a strict zod schema and
// `$`/`.` keys are stripped globally (see middleware/security.js), so we never pass raw
// user objects into query filters.
mongoose.set('strictQuery', true);

export async function connectDB(uri = env.MONGODB_URI) {
  await mongoose.connect(uri, {
    autoIndex: true, // collections are small; keeps unique indexes in sync in every environment
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
  });
  if (!env.isTest) console.log(`✅ MongoDB connected (${mongoose.connection.name})`);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
