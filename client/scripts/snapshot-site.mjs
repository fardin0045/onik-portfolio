/**
 * Build-time snapshot of the public site payload (GET /api/public/site).
 *
 * The snapshot is bundled into the app and rendered immediately on the first visit, so the page
 * never waits for the API (a cold serverless function + MongoDB connection can take many seconds).
 * The live API is still queried in the background and its fresh data replaces the snapshot.
 *
 * Runs automatically before `npm run build`. If the API cannot be reached the previously committed
 * snapshot is kept, so a build never fails because the backend is down.
 *
 * Override the source with SNAPSHOT_API_URL (e.g. http://localhost:4000).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = (process.env.SNAPSHOT_API_URL || 'https://onik-portfolio-api.vercel.app').replace(/\/$/, '');
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/site-snapshot.json');
const ATTEMPTS = 3;

async function fetchSite() {
  let lastError;
  for (let i = 1; i <= ATTEMPTS; i += 1) {
    try {
      const res = await fetch(`${API}/api/public/site`, {
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(60_000), // generous: the API may be cold
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.profile || !data?.settings) throw new Error('unexpected payload');
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`[snapshot] attempt ${i}/${ATTEMPTS} failed: ${err.message}`);
    }
  }
  throw lastError;
}

try {
  const data = await fetchSite();
  data.preview = false;
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(data)}\n`);
  console.log(`[snapshot] saved site data from ${API} (${data.projects?.length ?? 0} projects)`);
} catch (err) {
  const existing = await readFile(OUT, 'utf8').catch(() => null);
  if (existing) {
    console.warn(`[snapshot] keeping the existing snapshot (${err.message})`);
  } else {
    await mkdir(path.dirname(OUT), { recursive: true });
    await writeFile(OUT, 'null\n');
    console.warn(`[snapshot] no snapshot available (${err.message}); the site will load from the API only`);
  }
}
