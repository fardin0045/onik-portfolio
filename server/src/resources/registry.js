import {
  Achievement,
  Certification,
  Education,
  Experience,
  Post,
  Project,
  Research,
  Service,
  SocialLink,
  Skill,
  Testimonial,
} from '../models/content.js';
import {
  achievementSchema,
  certificationSchema,
  educationSchema,
  experienceSchema,
  postSchema,
  projectSchema,
  researchSchema,
  serviceSchema,
  socialLinkSchema,
  skillSchema,
  testimonialSchema,
} from '../validators/resources.js';

/**
 * Every admin-managed collection is described once here. The generic CRUD router
 * (routes/admin/crud.routes.js) and the public content aggregator read this registry,
 * so a new collection only needs: model + zod schema + one entry below
 * (+ a matching entry in client/src/admin/resources.js for the dashboard form).
 *
 *  - slugFrom:    field used to auto-generate a unique `slug`
 *  - publicKey:   key under which published items are returned by GET /api/public/site
 *  - searchFields fields used by the admin list `?q=` search
 */
export const RESOURCES = {
  projects: { model: Project, schema: projectSchema, slugFrom: 'title', publicKey: 'projects', searchFields: ['title', 'category', 'technologies'] },
  skills: { model: Skill, schema: skillSchema, publicKey: 'skills', searchFields: ['name', 'category'] },
  experience: { model: Experience, schema: experienceSchema, publicKey: 'experience', searchFields: ['role', 'company'] },
  education: { model: Education, schema: educationSchema, publicKey: 'education', searchFields: ['degree', 'institution'] },
  research: { model: Research, schema: researchSchema, publicKey: 'research', searchFields: ['title', 'institution'] },
  certifications: { model: Certification, schema: certificationSchema, publicKey: 'certifications', searchFields: ['name', 'issuer'] },
  achievements: { model: Achievement, schema: achievementSchema, publicKey: 'achievements', searchFields: ['title', 'organization'] },
  services: { model: Service, schema: serviceSchema, publicKey: 'services', searchFields: ['title'] },
  testimonials: { model: Testimonial, schema: testimonialSchema, publicKey: 'testimonials', searchFields: ['name', 'company'] },
  posts: {
    model: Post,
    schema: postSchema,
    slugFrom: 'title',
    publicKey: 'posts',
    searchFields: ['title', 'tags'],
    // The home page only needs summaries – full content is fetched on the article page.
    publicProjection: '-content',
    publicLimit: 6,
    publicSort: { publishedAt: -1, order: 1, createdAt: -1 },
  },
  socialLinks: { model: SocialLink, schema: socialLinkSchema, publicKey: 'socialLinks', searchFields: ['platform', 'label'] },
};

export const RESOURCE_NAMES = Object.keys(RESOURCES);
