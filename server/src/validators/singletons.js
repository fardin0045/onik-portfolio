import { z } from 'zod';
import { email, hexColor, image, markdown, optionalEmail, tags, text, url } from './common.js';

/**
 * Registry of public page sections. Adding a new section = add an entry here
 * (+ a React component registered in client/src/sections/registry.js).
 * Existing databases pick up new sections automatically (see normalizeSections).
 */
export const SECTION_DEFAULTS = [
  { key: 'hero', title: 'Home', eyebrow: '', subtitle: '', enabled: true, showInNav: false },
  { key: 'about', title: 'About Me', eyebrow: 'About', subtitle: '', enabled: true, showInNav: true },
  { key: 'skills', title: 'Skills & Technologies', eyebrow: 'Toolkit', subtitle: 'Languages, frameworks and tools I work with.', enabled: true, showInNav: true },
  { key: 'experience', title: 'Work Experience', eyebrow: 'Career', subtitle: '', enabled: true, showInNav: true },
  { key: 'internships', title: 'Internships', eyebrow: 'Career', subtitle: '', enabled: true, showInNav: false },
  { key: 'projects', title: 'Featured Projects', eyebrow: 'Work', subtitle: 'Full-stack applications I have designed, built and deployed.', enabled: true, showInNav: true },
  { key: 'research', title: 'Research & Thesis', eyebrow: 'Research', subtitle: '', enabled: true, showInNav: false },
  { key: 'education', title: 'Education', eyebrow: 'Academics', subtitle: '', enabled: true, showInNav: true },
  { key: 'certifications', title: 'Certifications', eyebrow: 'Credentials', subtitle: '', enabled: true, showInNav: false },
  { key: 'achievements', title: 'Achievements', eyebrow: 'Recognition', subtitle: '', enabled: true, showInNav: false },
  { key: 'services', title: 'Services', eyebrow: 'What I do', subtitle: '', enabled: true, showInNav: false },
  { key: 'testimonials', title: 'Testimonials', eyebrow: 'Kind words', subtitle: '', enabled: true, showInNav: false },
  { key: 'blog', title: 'Articles', eyebrow: 'Writing', subtitle: '', enabled: true, showInNav: false },
  { key: 'resume', title: 'Resume', eyebrow: 'Resume', subtitle: 'Download a copy of my CV.', enabled: true, showInNav: false },
  { key: 'contact', title: 'Get in Touch', eyebrow: 'Contact', subtitle: 'Have an opportunity or a question? My inbox is open.', enabled: true, showInNav: true },
];
export const SECTION_KEYS = SECTION_DEFAULTS.map((s) => s.key);

const sectionSchema = z
  .object({
    key: z.enum(SECTION_KEYS),
    title: text(80).default(''),
    eyebrow: text(40).default(''),
    subtitle: text(300).default(''),
    enabled: z.boolean().default(true),
    showInNav: z.boolean().default(false),
  })
  .strict();

/** Keeps admin ordering, drops unknown keys, appends newly introduced sections. */
export function normalizeSections(list = []) {
  const seen = new Set();
  const out = [];
  for (const s of list) {
    if (!SECTION_KEYS.includes(s?.key) || seen.has(s.key)) continue;
    seen.add(s.key);
    out.push({ ...SECTION_DEFAULTS.find((d) => d.key === s.key), ...s });
  }
  SECTION_DEFAULTS.forEach((d) => !seen.has(d.key) && out.push({ ...d }));
  // Hero is always first.
  return [...out.filter((s) => s.key === 'hero'), ...out.filter((s) => s.key !== 'hero')];
}

const imageDefault = () => image().default({ url: '', alt: '' });

export const profileSchema = z
  .object({
    name: text(80).pipe(z.string().min(1, 'Name is required')),
    title: text(120).default(''),
    headline: text(200).default(''),
    shortIntro: text(600).default(''),
    bio: markdown(8000).default(''),
    careerObjective: text(1500).default(''),
    location: text(120).default(''),
    availability: text(120).default(''),
    avatar: imageDefault(),
    // Optional transparent (background-removed) portrait used by the hero "pop-out" design.
    heroImage: imageDefault(),
    resume: z
      .object({ url: url().default(''), fileName: text(160).default(''), updatedAt: text(40).default('') })
      .strict()
      .default({ url: '', fileName: '', updatedAt: '' }),
    highlights: z
      .array(z.object({ value: text(30).pipe(z.string().min(1)), label: text(80).pipe(z.string().min(1)) }).strict())
      .max(6)
      .default([]),
    contact: z
      .object({
        email: optionalEmail().default(''),
        phone: text(40).default(''),
        location: text(120).default(''),
        showEmail: z.boolean().default(true),
        showPhone: z.boolean().default(true),
        formEnabled: z.boolean().default(true),
        note: text(300).default(''),
      })
      .strict()
      .prefault({}),
  })
  .strict();

export const settingsSchema = z
  .object({
    general: z
      .object({
        siteTitle: text(80).default('Portfolio'),
        logoText: text(40).default(''),
        logo: imageDefault(),
        favicon: url().default(''),
      })
      .strict()
      .prefault({}),
    theme: z
      .object({
        primaryColor: hexColor().default('#5b8cff'),
        defaultTheme: z.enum(['dark', 'light', 'system']).default('dark'),
        allowToggle: z.boolean().default(true),
      })
      .strict()
      .prefault({}),
    hero: z
      .object({
        greeting: text(80).default("Hi, I'm"),
        ctaProjectsLabel: text(40).default('View Projects'),
        ctaCvLabel: text(40).default('Download CV'),
        ctaContactLabel: text(40).default('Contact Me'),
        showSocials: z.boolean().default(true),
      })
      .strict()
      .prefault({}),
    seo: z
      .object({
        title: text(120).default(''),
        description: text(320).default(''),
        keywords: tags(30, 60).default([]),
        ogImage: url().default(''),
        twitterHandle: text(40).default(''),
        siteUrl: url().default(''),
        indexable: z.boolean().default(true),
      })
      .strict()
      .prefault({}),
    welcome: z
      .object({
        enabled: z.boolean().default(true),
        title: text(60).default('Hello there! 👋'),
        message: text(160).default('Welcome to my portfolio — glad you stopped by.'),
        // Follow-up tips shown by the assistant as the visitor explores (each once per visit).
        followUps: z.boolean().default(true),
        projectsMessage: text(160).default('Take a look at my projects — most of them have a live demo you can try.'),
        contactMessage: text(160).default("Have an opportunity or a question? Drop me a message — I'd love to hear from you."),
        cvMessage: text(160).default('Grab a copy of my CV — everything about me in one place.'),
        thanksMessage: text(160).default('Hope you found what you were looking for. Have a great day!'),
      })
      .strict()
      .prefault({}),
    footer: z
      .object({
        text: text(300).default(''),
        showSocials: z.boolean().default(true),
      })
      .strict()
      .prefault({}),
    sections: z.array(sectionSchema).max(50).default([]).transform(normalizeSections),
  })
  .strict();

export const SINGLETONS = {
  profile: profileSchema,
  settings: settingsSchema,
};

export { email };
