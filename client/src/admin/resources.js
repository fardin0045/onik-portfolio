import {
  Award,
  Briefcase,
  FlaskConical,
  FolderGit2,
  GraduationCap,
  MessageSquareQuote,
  Newspaper,
  Rocket,
  Share2,
  Trophy,
  Wrench,
} from 'lucide-react';
import { SOCIAL_PLATFORMS } from '../components/ui/SocialIcon.jsx';

/**
 * Declarative admin configuration for every collection.
 * The generic ResourceManager renders list + form from this – adding a new
 * admin-managed collection only needs a new entry here (and the matching
 * server model/schema/registry entry).
 *
 * Field types: text | textarea | markdown | url | email | number | switch | select |
 *              tags | lines | image | gallery | document | color | repeater
 * `span: 2` makes a field full-width in the two-column form grid.
 */

const published = { name: 'isPublished', label: 'Visible on website', type: 'switch', defaultValue: true, help: 'Turn off to keep this item as a hidden draft (still visible in Preview).' };

const SERVICE_ICON_OPTIONS = ['code', 'web', 'server', 'database', 'mobile', 'design', 'cloud', 'security', 'rocket', 'tools', 'layers', 'sparkles'].map((v) => ({ value: v, label: v }));

export const RESOURCES = {
  projects: {
    label: 'Projects',
    singular: 'Project',
    icon: FolderGit2,
    description: 'Portfolio projects shown in the Projects section and on their own detail pages.',
    folder: 'projects',
    fields: [
      { name: 'title', label: 'Project title', type: 'text', required: true, maxLength: 120, span: 2 },
      { name: 'shortDescription', label: 'Short description', type: 'textarea', required: true, maxLength: 300, rows: 3, span: 2, help: 'Shown on the project card (1–2 sentences).' },
      { name: 'description', label: 'Detailed description', type: 'markdown', maxLength: 20000, span: 2, help: 'Shown on the project page. Markdown supported (lists, **bold**, links, headings).' },
      { name: 'thumbnail', label: 'Thumbnail', type: 'image', span: 2, help: 'Recommended 1600×1000 (16:10).' },
      { name: 'images', label: 'Gallery images', type: 'gallery', span: 2 },
      { name: 'technologies', label: 'Technologies', type: 'tags', placeholder: 'React, Node.js…', span: 2 },
      { name: 'category', label: 'Category', type: 'text', maxLength: 60, placeholder: 'Full-Stack Web App' },
      { name: 'completedAt', label: 'Completion date', type: 'text', maxLength: 40, placeholder: 'e.g. March 2026' },
      { name: 'githubUrl', label: 'GitHub URL', type: 'url' },
      { name: 'liveUrl', label: 'Live demo URL', type: 'url' },
      { name: 'docsUrl', label: 'Documentation URL', type: 'url' },
      { name: 'slug', label: 'URL slug', type: 'text', maxLength: 80, help: 'Auto-generated from the title when empty. Changing it changes the page URL.' },
      { name: 'featured', label: 'Featured project', type: 'switch', defaultValue: false, help: 'Featured projects are shown first with a badge.' },
      published,
    ],
    list: {
      title: (i) => i.title,
      subtitle: (i) => [i.category, (i.technologies || []).slice(0, 4).join(', ')].filter(Boolean).join(' · '),
      image: (i) => i.thumbnail?.url,
      featured: true,
    },
  },

  skills: {
    label: 'Skills',
    singular: 'Skill',
    icon: Wrench,
    description: 'Skills are grouped by category on the website. Use the same category name to group them.',
    fields: [
      { name: 'name', label: 'Skill', type: 'text', required: true, maxLength: 60 },
      { name: 'category', label: 'Category', type: 'text', required: true, maxLength: 60, placeholder: 'Frontend Development', suggestionsFrom: 'category' },
      { name: 'level', label: 'Proficiency % (optional)', type: 'number', min: 0, max: 100, help: 'Leave empty to hide.' },
      published,
    ],
    list: { title: (i) => i.name, subtitle: (i) => i.category, groupBy: 'category' },
  },

  experience: {
    label: 'Experience',
    singular: 'Experience',
    icon: Briefcase,
    description: 'Work experience and internships. Internships appear in their own section on the website.',
    folder: 'logos',
    filters: [
      { value: '', label: 'All' },
      { value: 'work', label: 'Work' },
      { value: 'internship', label: 'Internships' },
    ],
    fields: [
      { name: 'type', label: 'Type', type: 'select', required: true, defaultValue: 'work', options: [{ value: 'work', label: 'Work experience' }, { value: 'internship', label: 'Internship' }] },
      { name: 'employmentType', label: 'Employment type', type: 'text', maxLength: 60, placeholder: 'Full-time, Part-time, Remote…' },
      { name: 'role', label: 'Role / Position', type: 'text', required: true, maxLength: 120 },
      { name: 'company', label: 'Company', type: 'text', required: true, maxLength: 120 },
      { name: 'companyUrl', label: 'Company website', type: 'url' },
      { name: 'location', label: 'Location', type: 'text', maxLength: 120 },
      { name: 'startDate', label: 'Start', type: 'text', maxLength: 40, placeholder: 'Jan 2026' },
      { name: 'endDate', label: 'End', type: 'text', maxLength: 40, placeholder: 'Jun 2026' },
      { name: 'current', label: 'I currently work here', type: 'switch', defaultValue: false },
      { name: 'logo', label: 'Company logo', type: 'image', span: 2 },
      { name: 'description', label: 'Description', type: 'markdown', maxLength: 5000, span: 2 },
      { name: 'highlights', label: 'Key achievements (one per line)', type: 'lines', span: 2 },
      { name: 'technologies', label: 'Technologies', type: 'tags', span: 2 },
      published,
    ],
    list: { title: (i) => `${i.role} · ${i.company}`, subtitle: (i) => [i.type === 'internship' ? 'Internship' : 'Work', [i.startDate, i.current ? 'Present' : i.endDate].filter(Boolean).join(' — ')].filter(Boolean).join(' · '), image: (i) => i.logo?.url },
  },

  education: {
    label: 'Education',
    singular: 'Education',
    icon: GraduationCap,
    folder: 'logos',
    fields: [
      { name: 'degree', label: 'Degree / Certificate', type: 'text', required: true, maxLength: 160, span: 2 },
      { name: 'field', label: 'Field of study', type: 'text', maxLength: 160 },
      { name: 'result', label: 'Result / Grade', type: 'text', maxLength: 120, placeholder: 'CGPA 3.79 / 4.00' },
      { name: 'institution', label: 'Institution', type: 'text', required: true, maxLength: 200, span: 2 },
      { name: 'location', label: 'Location', type: 'text', maxLength: 120 },
      { name: 'startDate', label: 'Start', type: 'text', maxLength: 40 },
      { name: 'endDate', label: 'End', type: 'text', maxLength: 40, placeholder: 'Expected 2026' },
      { name: 'logo', label: 'Institution logo', type: 'image', span: 2 },
      { name: 'description', label: 'Description', type: 'markdown', maxLength: 3000, span: 2 },
      published,
    ],
    list: { title: (i) => i.degree, subtitle: (i) => [i.institution, i.result].filter(Boolean).join(' · '), image: (i) => i.logo?.url },
  },

  research: {
    label: 'Research',
    singular: 'Research item',
    icon: FlaskConical,
    description: 'Thesis, papers and research projects.',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 250, span: 2 },
      { name: 'type', label: 'Type', type: 'text', maxLength: 60, placeholder: 'Thesis, Paper, Research project…' },
      { name: 'status', label: 'Status', type: 'text', maxLength: 60, placeholder: 'Ongoing, Published…' },
      { name: 'institution', label: 'Institution / Publisher', type: 'text', maxLength: 200 },
      { name: 'supervisor', label: 'Supervisor', type: 'text', maxLength: 120 },
      { name: 'date', label: 'Date', type: 'text', maxLength: 40 },
      { name: 'url', label: 'Link (paper, repo…)', type: 'url' },
      { name: 'abstract', label: 'Abstract', type: 'markdown', maxLength: 8000, span: 2 },
      { name: 'technologies', label: 'Keywords / technologies', type: 'tags', span: 2 },
      published,
    ],
    list: { title: (i) => i.title, subtitle: (i) => [i.type, i.status, i.date].filter(Boolean).join(' · ') },
  },

  certifications: {
    label: 'Certifications',
    singular: 'Certification',
    icon: Award,
    folder: 'certifications',
    fields: [
      { name: 'name', label: 'Certification name', type: 'text', required: true, maxLength: 200, span: 2 },
      { name: 'issuer', label: 'Issuing organization', type: 'text', required: true, maxLength: 160 },
      { name: 'credentialId', label: 'Credential ID', type: 'text', maxLength: 120 },
      { name: 'issueDate', label: 'Issue date', type: 'text', maxLength: 40 },
      { name: 'expiryDate', label: 'Expiry date', type: 'text', maxLength: 40 },
      { name: 'credentialUrl', label: 'Credential URL', type: 'url', span: 2 },
      { name: 'image', label: 'Certificate image', type: 'image', span: 2 },
      published,
    ],
    list: { title: (i) => i.name, subtitle: (i) => [i.issuer, i.issueDate].filter(Boolean).join(' · '), image: (i) => i.image?.url },
  },

  achievements: {
    label: 'Achievements',
    singular: 'Achievement',
    icon: Trophy,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 200, span: 2 },
      { name: 'organization', label: 'Organization / Event', type: 'text', maxLength: 160 },
      { name: 'date', label: 'Date', type: 'text', maxLength: 40 },
      { name: 'url', label: 'Link', type: 'url', span: 2 },
      { name: 'description', label: 'Description', type: 'markdown', maxLength: 3000, span: 2 },
      published,
    ],
    list: { title: (i) => i.title, subtitle: (i) => [i.organization, i.date].filter(Boolean).join(' · ') },
  },

  services: {
    label: 'Services',
    singular: 'Service',
    icon: Rocket,
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 120 },
      { name: 'icon', label: 'Icon', type: 'select', options: SERVICE_ICON_OPTIONS, defaultValue: 'code' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, maxLength: 1000, rows: 4, span: 2 },
      published,
    ],
    list: { title: (i) => i.title, subtitle: (i) => i.description },
  },

  testimonials: {
    label: 'Testimonials',
    singular: 'Testimonial',
    icon: MessageSquareQuote,
    folder: 'testimonials',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 120 },
      { name: 'role', label: 'Role', type: 'text', maxLength: 120 },
      { name: 'company', label: 'Company', type: 'text', maxLength: 120 },
      { name: 'url', label: 'Profile link', type: 'url' },
      { name: 'quote', label: 'Quote', type: 'textarea', required: true, maxLength: 1500, rows: 5, span: 2 },
      { name: 'avatar', label: 'Photo', type: 'image', span: 2 },
      published,
    ],
    list: { title: (i) => i.name, subtitle: (i) => [i.role, i.company].filter(Boolean).join(', '), image: (i) => i.avatar?.url },
  },

  posts: {
    label: 'Blog',
    singular: 'Article',
    icon: Newspaper,
    description: 'Articles are published on /blog. Use "External URL" to link to posts hosted elsewhere (Medium, DEV…).',
    folder: 'blog',
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 200, span: 2 },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', maxLength: 400, rows: 3, span: 2 },
      { name: 'content', label: 'Content', type: 'markdown', maxLength: 100000, rows: 18, span: 2 },
      { name: 'coverImage', label: 'Cover image', type: 'image', span: 2 },
      { name: 'tags', label: 'Tags', type: 'tags', span: 2 },
      { name: 'publishedAt', label: 'Publish date', type: 'date' },
      { name: 'externalUrl', label: 'External URL (optional)', type: 'url' },
      { name: 'slug', label: 'URL slug', type: 'text', maxLength: 80, help: 'Auto-generated from the title when empty.' },
      published,
    ],
    list: { title: (i) => i.title, subtitle: (i) => [i.publishedAt, (i.tags || []).join(', ')].filter(Boolean).join(' · '), image: (i) => i.coverImage?.url },
  },

  socialLinks: {
    label: 'Social Links',
    singular: 'Social link',
    icon: Share2,
    description: 'Shown in the hero, contact section and footer.',
    fields: [
      { name: 'platform', label: 'Platform', type: 'select', required: true, defaultValue: 'github', options: Object.entries(SOCIAL_PLATFORMS).map(([value, p]) => ({ value, label: p.label })) },
      { name: 'label', label: 'Label (optional)', type: 'text', maxLength: 60 },
      { name: 'url', label: 'URL', type: 'text', required: true, maxLength: 2048, span: 2, placeholder: 'https://… , mailto:… or tel:…', pattern: /^(https?:\/\/|mailto:|tel:)/, patternMessage: 'Must start with https://, mailto: or tel:' },
      { name: 'showInHero', label: 'Show in hero section', type: 'switch', defaultValue: true },
      published,
    ],
    list: { title: (i) => i.label || SOCIAL_PLATFORMS[i.platform]?.label || i.platform, subtitle: (i) => i.url },
  },
};

export const RESOURCE_KEYS = Object.keys(RESOURCES);
