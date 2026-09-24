import { lazy } from 'react';
import { Hero } from './Hero.jsx';

/**
 * Public section registry.
 * key       – must match a key in server/src/validators/singletons.js (SECTION_DEFAULTS)
 * component – React component receiving { site, section }
 * hasContent – the section is hidden automatically while it has nothing to show
 *
 * Order, titles and visibility are controlled from Dashboard → Website Settings → Sections.
 * Below-the-fold sections are lazy-loaded (code splitting).
 */
const About = lazy(() => import('./About.jsx'));
const Skills = lazy(() => import('./Skills.jsx'));
const Experience = lazy(() => import('./Experience.jsx'));
const Projects = lazy(() => import('./Projects.jsx'));
const Research = lazy(() => import('./Research.jsx'));
const Education = lazy(() => import('./Education.jsx'));
const Certifications = lazy(() => import('./Certifications.jsx'));
const Achievements = lazy(() => import('./Achievements.jsx'));
const Services = lazy(() => import('./Services.jsx'));
const Testimonials = lazy(() => import('./Testimonials.jsx'));
const Blog = lazy(() => import('./Blog.jsx'));
const Resume = lazy(() => import('./Resume.jsx'));
const Contact = lazy(() => import('./Contact.jsx'));

const work = (s) => s.experience?.filter((e) => e.type !== 'internship') ?? [];
const internships = (s) => s.experience?.filter((e) => e.type === 'internship') ?? [];

export const SECTION_REGISTRY = {
  hero: { component: Hero, hasContent: () => true },
  about: { component: About, hasContent: (s) => Boolean(s.profile.bio || s.profile.careerObjective) },
  skills: { component: Skills, hasContent: (s) => s.skills.length > 0 },
  experience: { component: Experience, hasContent: (s) => work(s).length > 0, props: { type: 'work' } },
  internships: { component: Experience, hasContent: (s) => internships(s).length > 0, props: { type: 'internship' } },
  projects: { component: Projects, hasContent: (s) => s.projects.length > 0 },
  research: { component: Research, hasContent: (s) => s.research.length > 0 },
  education: { component: Education, hasContent: (s) => s.education.length > 0 },
  certifications: { component: Certifications, hasContent: (s) => s.certifications.length > 0 },
  achievements: { component: Achievements, hasContent: (s) => s.achievements.length > 0 },
  services: { component: Services, hasContent: (s) => s.services.length > 0 },
  testimonials: { component: Testimonials, hasContent: (s) => s.testimonials.length > 0 },
  blog: { component: Blog, hasContent: (s) => s.posts.length > 0 },
  resume: { component: Resume, hasContent: (s) => Boolean(s.profile.resume?.url) },
  contact: {
    component: Contact,
    hasContent: (s) => Boolean(s.profile.contact.formEnabled || s.profile.contact.email || s.profile.contact.phone),
  },
};

/** Sections that are enabled in settings, known to the client and have content. */
export function visibleSections(site) {
  return (site.settings.sections || []).filter((s) => {
    const def = SECTION_REGISTRY[s.key];
    return s.enabled && def && def.hasContent(site);
  });
}

export const isBlogVisible = (site) =>
  Boolean(site?.counts?.posts > 0 && site.settings.sections.find((s) => s.key === 'blog')?.enabled);
