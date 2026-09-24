import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// NoSQL-injection defence: every request body is validated by a strict zod schema and
// `$`/`.` keys are stripped globally (see middleware/security.js), so we never pass raw
// user objects into query filters.
mongoose.set('strictQuery', true);

const PUBLIC_DNS = ['1.1.1.1', '8.8.8.8'];

/**
 * `mongodb+srv://` URIs need a DNS SRV lookup. Some Windows setups (VPN/antivirus DNS relays on
 * 127.0.0.1) refuse SRV queries from Node (`querySrv ECONNREFUSED`) even though browsing works.
 * If the system resolver fails, fall back to public DNS servers for this process.
 */
export async function ensureSrvResolvable(uri) {
  if (!uri?.startsWith('mongodb+srv://')) return;
  const host = uri.replace(/^mongodb\+srv:\/\/([^@]*@)?/, '').split(/[/?]/)[0];
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
  } catch (err) {
    if (!['ECONNREFUSED', 'ETIMEOUT', 'ESERVFAIL', 'ECONNRESET'].includes(err.code)) return;
    console.warn(`⚠️  System DNS could not resolve the MongoDB SRV record (${err.code}); using public DNS ${PUBLIC_DNS.join(', ')}.`);
    dns.setServers(PUBLIC_DNS);
  }
}

export async function connectDB(uri = env.MONGODB_URI) {
  await ensureSrvResolvable(uri);
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
