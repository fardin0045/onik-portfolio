import { z } from 'zod';
import { baseItem, image, markdown, requiredText, tags, text, url, mailOrTel } from './common.js';

/**
 * Zod schemas for every admin-managed collection.
 * These are the single source of truth for what the API accepts.
 * Create uses the schema as-is; update uses `schema.partial()`.
 */

export const projectSchema = z
  .object({
    title: requiredText(120, 'Title'),
    slug: text(80).optional(),
    shortDescription: requiredText(300, 'Short description'),
    description: markdown(20000).optional(),
    thumbnail: image().optional(),
    images: z.array(image()).max(20).optional(),
    technologies: tags(30).optional(),
    category: text(60).optional(),
    githubUrl: url().optional(),
    liveUrl: url().optional(),
    docsUrl: url().optional(),
    featured: z.boolean().optional(),
    completedAt: text(40).optional(),
    ...baseItem,
  })
  .strict();

export const skillSchema = z
  .object({
    name: requiredText(60, 'Name'),
    category: requiredText(60, 'Category'),
    level: z.coerce.number().int().min(0).max(100).optional(),
    icon: text(60).optional(),
    ...baseItem,
  })
  .strict();

export const experienceSchema = z
  .object({
    type: z.enum(['work', 'internship']),
    role: requiredText(120, 'Role'),
    company: requiredText(120, 'Company'),
    companyUrl: url().optional(),
    location: text(120).optional(),
    employmentType: text(60).optional(),
    startDate: text(40).optional(),
    endDate: text(40).optional(),
    current: z.boolean().optional(),
    description: markdown(5000).optional(),
    highlights: z.array(text(400)).max(20).optional(),
    technologies: tags(30).optional(),
    logo: image().optional(),
    ...baseItem,
  })
  .strict();

export const educationSchema = z
  .object({
    degree: requiredText(160, 'Degree'),
    field: text(160).optional(),
    institution: requiredText(200, 'Institution'),
    location: text(120).optional(),
    startDate: text(40).optional(),
    endDate: text(40).optional(),
    result: text(120).optional(),
    description: markdown(3000).optional(),
    logo: image().optional(),
    ...baseItem,
  })
  .strict();

export const researchSchema = z
  .object({
    title: requiredText(250, 'Title'),
    type: text(60).optional(),
    institution: text(200).optional(),
    supervisor: text(120).optional(),
    status: text(60).optional(),
    date: text(40).optional(),
    abstract: markdown(8000).optional(),
    url: url().optional(),
    technologies: tags(30).optional(),
    ...baseItem,
  })
  .strict();

export const certificationSchema = z
  .object({
    name: requiredText(200, 'Name'),
    issuer: requiredText(160, 'Issuer'),
    issueDate: text(40).optional(),
    expiryDate: text(40).optional(),
    credentialId: text(120).optional(),
    credentialUrl: url().optional(),
    image: image().optional(),
    ...baseItem,
  })
  .strict();

export const achievementSchema = z
  .object({
    title: requiredText(200, 'Title'),
    organization: text(160).optional(),
    date: text(40).optional(),
    description: markdown(3000).optional(),
    url: url().optional(),
    ...baseItem,
  })
  .strict();

export const serviceSchema = z
  .object({
    title: requiredText(120, 'Title'),
    description: requiredText(1000, 'Description'),
    icon: text(60).optional(),
    ...baseItem,
  })
  .strict();

export const testimonialSchema = z
  .object({
    name: requiredText(120, 'Name'),
    role: text(120).optional(),
    company: text(120).optional(),
    quote: requiredText(1500, 'Quote'),
    avatar: image().optional(),
    url: url().optional(),
    ...baseItem,
  })
  .strict();

export const postSchema = z
  .object({
    title: requiredText(200, 'Title'),
    slug: text(80).optional(),
    excerpt: text(400).optional(),
    content: markdown(100000).optional(),
    coverImage: image().optional(),
    tags: tags(20).optional(),
    externalUrl: url().optional(),
    publishedAt: text(40).optional(),
    ...baseItem,
  })
  .strict();

export const socialLinkSchema = z
  .object({
    platform: requiredText(40, 'Platform'),
    label: text(60).optional(),
    url: mailOrTel().pipe(z.string().min(1, 'URL is required')),
    showInHero: z.boolean().optional(),
    ...baseItem,
  })
  .strict();
