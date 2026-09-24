import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { MongoMemoryServer } from 'mongodb-memory-server';
import sharp from 'sharp';
import request from 'supertest';

const ADMIN = { email: 'admin@example.com', password: 'Sup3r-Secure-Pass' };
let mongod;
let app;
let Media;

before(async () => {
  mongod = await MongoMemoryServer.create();
  Object.assign(process.env, {
    NODE_ENV: 'test',
    MONGODB_URI: mongod.getUri('portfolio-test'),
    JWT_SECRET: 'x'.repeat(40) + 'test-only-secret-value',
    CORS_ORIGINS: 'http://localhost:5173',
    STORAGE_DRIVER: 'local',
    ADMIN_EMAIL: ADMIN.email,
    ADMIN_PASSWORD: ADMIN.password,
  });
  const { connectDB } = await import('../src/config/db.js');
  const { createApp } = await import('../src/app.js');
  const { ensureAdmin } = await import('../src/seed/create-admin.js');
  ({ Media } = await import('../src/models/Media.js'));
  await connectDB();
  await ensureAdmin({ quiet: true });
  app = createApp();
});

after(async () => {
  const { deleteMedia } = await import('../src/services/media.service.js');
  for (const m of await Media.find()) await deleteMedia(m); // clean up uploaded test files
  const { disconnectDB } = await import('../src/config/db.js');
  await disconnectDB();
  await mongod.stop();
});

const XRW = { 'X-Requested-With': 'XMLHttpRequest' };

async function login() {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').set(XRW).send(ADMIN);
  assert.equal(res.status, 200, JSON.stringify(res.body));
  return agent;
}

describe('authentication', () => {
  test('rejects wrong password with a generic message', async () => {
    const res = await request(app).post('/api/auth/login').set(XRW).send({ ...ADMIN, password: 'nope' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Invalid e-mail or password');
  });

  test('unknown e-mail gets the same message (no enumeration)', async () => {
    const res = await request(app).post('/api/auth/login').set(XRW).send({ email: 'x@y.com', password: 'nope' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Invalid e-mail or password');
  });

  test('sets httpOnly cookies and never returns the password hash', async () => {
    const res = await request(app).post('/api/auth/login').set(XRW).send(ADMIN);
    assert.equal(res.status, 200);
    const cookies = res.headers['set-cookie'].join(';');
    assert.match(cookies, /pf_access=.*HttpOnly/);
    assert.match(cookies, /pf_refresh=.*HttpOnly/);
    assert.equal(JSON.stringify(res.body).includes('passwordHash'), false);
  });

  test('state-changing requests without the CSRF header are refused', async () => {
    const res = await request(app).post('/api/auth/login').send(ADMIN);
    assert.equal(res.status, 403);
  });

  test('foreign Origin is refused', async () => {
    const res = await request(app).post('/api/auth/login').set(XRW).set('Origin', 'https://evil.example').send(ADMIN);
    assert.equal(res.status, 403);
  });

  test('refresh rotates the token and logout revokes the session', async () => {
    const agent = await login();
    assert.equal((await agent.post('/api/auth/refresh').set(XRW)).status, 200);
    assert.equal((await agent.get('/api/auth/me')).body.user.email, ADMIN.email);
    assert.equal((await agent.post('/api/auth/logout').set(XRW)).status, 200);
    assert.equal((await agent.get('/api/auth/me')).body.user, null);
    assert.equal((await agent.post('/api/auth/refresh').set(XRW)).body.user, null);
    assert.equal((await agent.get('/api/admin/overview')).status, 401);
  });
});

describe('authorization', () => {
  test('admin API is not reachable without a session', async () => {
    for (const [method, url] of [
      ['get', '/api/admin/overview'],
      ['get', '/api/admin/projects'],
      ['post', '/api/admin/projects'],
      ['patch', '/api/admin/singletons/profile'],
      ['post', '/api/admin/publish'],
      ['get', '/api/admin/messages'],
      ['post', '/api/admin/media'],
    ]) {
      // eslint-disable-next-line no-await-in-loop
      const res = await request(app)[method](url).set(XRW).send({});
      assert.equal(res.status, 401, `${method} ${url}`);
    }
  });

  test('a revoked refresh token cannot be reused', async () => {
    const res = await request(app).post('/api/auth/login').set(XRW).send(ADMIN);
    const refresh = res.headers['set-cookie'].find((c) => c.startsWith('pf_refresh=')).split(';')[0];
    const first = await request(app).post('/api/auth/refresh').set(XRW).set('Cookie', refresh);
    assert.equal(first.status, 200);
    // Concurrent refresh from a second tab (within the grace window): no new tokens are issued.
    const concurrent = await request(app).post('/api/auth/refresh').set(XRW).set('Cookie', refresh);
    assert.equal(concurrent.status, 200);
    assert.equal(concurrent.headers['set-cookie'], undefined, 'no tokens handed out for a rotated token');
    // Replay after the grace window -> the whole session is revoked.
    const { Session } = await import('../src/models/Session.js');
    await Session.updateMany({}, { $set: { lastUsedAt: new Date(Date.now() - 60_000) } });
    const replay = await request(app).post('/api/auth/refresh').set(XRW).set('Cookie', refresh);
    assert.equal(replay.status, 401, 'old token replay is rejected');
    const newRefresh = first.headers['set-cookie'].find((c) => c.startsWith('pf_refresh=')).split(';')[0];
    const afterTheft = await request(app).post('/api/auth/refresh').set(XRW).set('Cookie', newRefresh);
    assert.equal(afterTheft.status, 401, 'session revoked after token reuse');
  });

  test('forged / tampered token is rejected', async () => {
    const res = await request(app).get('/api/admin/overview').set('Cookie', 'pf_access=eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.');
    assert.equal(res.status, 401);
  });

  test('preview mode requires authentication', async () => {
    const res = await request(app).get('/api/public/site?preview=1');
    assert.equal(res.status, 401);
  });
});

describe('content management', () => {
  test('project CRUD, slug generation, validation, visibility and reorder', async () => {
    const agent = await login();

    const bad = await agent.post('/api/admin/projects').set(XRW).send({ title: '', githubUrl: 'javascript:alert(1)' });
    assert.equal(bad.status, 422);
    assert.ok(bad.body.fields.title);
    assert.ok(bad.body.fields.githubUrl);

    const injected = await agent.post('/api/admin/projects').set(XRW).send({ title: 'X', shortDescription: 'y', $where: '1', unknown: 1 });
    assert.equal(injected.status, 422, 'unknown keys are rejected by strict schemas');

    const a = await agent.post('/api/admin/projects').set(XRW).send({ title: 'My App', shortDescription: 'Demo', technologies: ['React', 'React'] });
    assert.equal(a.status, 201);
    assert.equal(a.body.item.slug, 'my-app');
    assert.deepEqual(a.body.item.technologies, ['React']);
    const b = await agent.post('/api/admin/projects').set(XRW).send({ title: 'My App', shortDescription: 'Second', isPublished: false });
    assert.equal(b.body.item.slug, 'my-app-2');

    let pub = await request(app).get('/api/public/site');
    assert.equal(pub.body.projects.length, 1, 'hidden project is not public');

    const preview = await agent.get('/api/public/site?preview=1');
    assert.equal(preview.body.projects.length, 2, 'hidden project visible in preview');

    const upd = await agent.patch(`/api/admin/projects/${a.body.item.id}`).set(XRW).send({ featured: true });
    assert.equal(upd.body.item.featured, true);
    assert.equal(upd.body.item.slug, 'my-app');

    const re = await agent.put('/api/admin/projects/reorder').set(XRW).send({ ids: [b.body.item.id, a.body.item.id] });
    assert.equal(re.status, 200);
    const list = await agent.get('/api/admin/projects');
    assert.equal(list.body.items[0].id, b.body.item.id);

    assert.equal((await agent.delete(`/api/admin/projects/${a.body.item.id}`).set(XRW)).status, 200);
    pub = await request(app).get('/api/public/site');
    assert.equal(pub.body.projects.length, 0, 'public cache invalidated after delete');
  });

  test('singleton drafts are only public after publishing', async () => {
    const agent = await login();
    const patch = await agent.patch('/api/admin/singletons/profile').set(XRW).send({ name: 'Draft Name', contact: { phone: '123', showPhone: false } });
    assert.equal(patch.status, 200);
    assert.equal(patch.body.item.name, 'Draft Name');

    let pub = await request(app).get('/api/public/site');
    assert.notEqual(pub.body.profile.name, 'Draft Name');
    const status = await agent.get('/api/admin/publish');
    assert.equal(status.body.profile.hasChanges, true);

    await agent.post('/api/admin/publish').set(XRW);
    pub = await request(app).get('/api/public/site');
    assert.equal(pub.body.profile.name, 'Draft Name');
    assert.equal(pub.body.profile.contact.phone, '', 'hidden phone number never leaves the server');

    const bad = await agent.patch('/api/admin/singletons/settings').set(XRW).send({ theme: { primaryColor: 'red;}' } });
    assert.equal(bad.status, 422);
  });

  test('unknown resource returns 404', async () => {
    const agent = await login();
    assert.equal((await agent.get('/api/admin/users')).status, 404);
  });
});

describe('uploads', () => {
  test('accepts a real image, converts it to WebP and rejects spoofed files', async () => {
    const agent = await login();
    const png = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#336699' } }).png().toBuffer();
    const ok = await agent.post('/api/admin/media').set(XRW).field('folder', 'projects').attach('file', png, 'pic.png');
    assert.equal(ok.status, 201, JSON.stringify(ok.body));
    assert.equal(ok.body.item.mimeType, 'image/webp');
    assert.match(ok.body.item.url, /^\/uploads\/projects\/.+\.webp$/);

    const fake = await agent
      .post('/api/admin/media')
      .set(XRW)
      .attach('file', Buffer.from('<svg onload="alert(1)"></svg>'), { filename: 'x.png', contentType: 'image/png' });
    assert.equal(fake.status, 400);

    const html = await agent.post('/api/admin/media').set(XRW).field('purpose', 'document').attach('file', png, 'cv.pdf');
    assert.equal(html.status, 400, 'image is not accepted where a PDF is required');
  });
});

describe('contact form', () => {
  test('validates input, stores messages and silently drops honeypot spam', async () => {
    const invalid = await request(app).post('/api/public/contact').set(XRW).send({ name: 'A', email: 'nope', subject: '', message: 'short' });
    assert.equal(invalid.status, 422);

    const spam = await request(app)
      .post('/api/public/contact')
      .set(XRW)
      .send({ name: 'Bot', email: 'bot@spam.com', subject: 'Buy now', message: 'Totally legit message', website: 'http://spam' });
    assert.equal(spam.status, 201);

    const real = await request(app)
      .post('/api/public/contact')
      .set(XRW)
      .send({ name: 'Recruiter', email: 'hr@company.com', subject: 'Internship', message: 'We would like to talk to you.', startedAt: Date.now() - 10000 });
    assert.equal(real.status, 201);

    const agent = await login();
    const inbox = await agent.get('/api/admin/messages');
    assert.equal(inbox.body.total, 1, 'only the genuine message is stored');
    assert.equal(inbox.body.items[0].ipHash, undefined, 'IP hash is never exposed');
  });
});

describe('seo', () => {
  test('robots.txt and sitemap.xml are generated', async () => {
    const robots = await request(app).get('/robots.txt');
    assert.equal(robots.status, 200);
    assert.match(robots.text, /Sitemap: /);
    const sitemap = await request(app).get('/sitemap.xml');
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.text, /<urlset/);
  });
});
