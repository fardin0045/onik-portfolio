/**
 * Bootstraps the database with the CV content, the profile photo, the CV PDF and the admin account.
 *
 *   npm run seed            -> seeds only empty collections (safe to re-run)
 *   npm run seed -- --force -> wipes portfolio CONTENT (not messages/admin) and re-seeds
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB, disconnectDB } from '../config/db.js';
import { Education, Experience, Project, SocialLink, Skill } from '../models/content.js';
import { SiteDocument } from '../models/SiteDocument.js';
import { processAndStore } from '../services/media.service.js';
import { profileSchema, settingsSchema } from '../validators/singletons.js';
import { ensureAdmin } from './create-admin.js';
import * as data from './data.js';

const ASSETS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets');
const force = process.argv.includes('--force');

async function uploadAsset(file, opts) {
  const buffer = await fs.readFile(path.join(ASSETS, file));
  const media = await processAndStore({ buffer, originalname: path.basename(file) }, opts);
  console.log(`   ↳ uploaded ${file} -> ${media.url}`);
  return media;
}

export async function seed({ withAdmin = true } = {}) {
  if (withAdmin) await ensureAdmin({ quiet: false });

  if (force) {
    console.log('⚠️  --force: removing existing portfolio content');
    await Promise.all([Project, Skill, Education, Experience, SocialLink, SiteDocument].map((M) => M.deleteMany({})));
  }

  // Replace placeholder singletons that were auto-created before the first seed
  // (e.g. the site was opened before running `npm run seed`).
  await SiteDocument.deleteMany({
    $or: [
      { autoCreated: true },
      { key: 'profile', 'draft.name': 'Your Name', 'published.name': 'Your Name' },
      { key: 'settings', 'draft.general.siteTitle': 'Portfolio', 'draft.seo.title': '', 'published.seo.title': '' },
    ],
  });

  // Profile + settings (draft and published start identical).
  if (!(await SiteDocument.exists({ key: 'profile' }))) {
    console.log('• Profile');
    const avatar = await uploadAsset('profile.jpg', { folder: 'profile', alt: 'Portrait of Onik' });
    const cutout = await uploadAsset('profile-cutout.png', { folder: 'profile', alt: 'Portrait of Onik' });
    const cv = await uploadAsset('Onik_CV.pdf', { folder: 'resume', purpose: 'document' });
    const profile = profileSchema.parse({
      ...data.profile,
      avatar: { url: avatar.url, alt: 'Portrait of Onik' },
      heroImage: { url: cutout.url, alt: 'Portrait of Onik' },
      resume: { url: cv.url, fileName: 'Onik_CV.pdf', updatedAt: new Date().toISOString().slice(0, 10) },
    });
    await SiteDocument.create({ key: 'profile', draft: profile, published: profile, publishedAt: new Date() });
  }
  if (!(await SiteDocument.exists({ key: 'settings' }))) {
    console.log('• Website settings');
    const settings = settingsSchema.parse(data.settings);
    await SiteDocument.create({ key: 'settings', draft: settings, published: settings, publishedAt: new Date() });
  }

  if ((await Skill.countDocuments()) === 0) {
    console.log('• Skills');
    await Skill.insertMany(data.skills.map((s, order) => ({ ...s, order })));
  }
  if ((await Education.countDocuments()) === 0) {
    console.log('• Education');
    await Education.insertMany(data.education.map((e, order) => ({ ...e, order })));
  }
  if ((await SocialLink.countDocuments()) === 0) {
    console.log('• Social links');
    await SocialLink.insertMany(data.socialLinks.map((s, order) => ({ ...s, order })));
  }
  if ((await Experience.countDocuments()) === 0) {
    console.log('• Experience');
    await Experience.insertMany(data.experience.map((e, order) => ({ ...e, order })));
  }
  if ((await Project.countDocuments()) === 0) {
    console.log('• Projects');
    for (const [order, { screenshot, ...p }] of [...data.projects, ...data.extraProjects].entries()) {
      let thumbnail = { url: '', alt: '' };
      try {
        const media = await uploadAsset(`projects/${screenshot}`, { folder: 'projects', alt: `${p.title} screenshot` });
        thumbnail = { url: media.url, alt: `Screenshot of the ${p.title.split(' –')[0]} home page` };
      } catch (err) {
        console.warn(`   ↳ no screenshot for ${p.title}: ${err.message}`);
      }
      // eslint-disable-next-line no-await-in-loop
      await Project.create({ ...p, thumbnail, images: thumbnail.url ? [thumbnail] : [], order });
    }
  }
  console.log('✅ Seed complete');
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  connectDB()
    .then(() => seed())
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exitCode = 1;
    })
    .finally(() => disconnectDB());
}

