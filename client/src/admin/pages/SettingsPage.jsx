import { useState } from 'react';
import { cn } from '../../lib/utils.js';
import { PageHeader } from '../components/PageHeader.jsx';
import { SectionsEditor } from '../components/SectionsEditor.jsx';
import { SingletonForm } from '../components/SingletonForm.jsx';

const PRESETS = ['#5b8cff', '#22c55e', '#14b8a6', '#a78bfa', '#f59e0b', '#f43f5e', '#e5e7eb'];

const TABS = {
  general: {
    label: 'General',
    groups: [
      {
        title: 'Website identity',
        folder: 'branding',
        fields: [
          { name: 'general.siteTitle', label: 'Website title', type: 'text', maxLength: 80, help: 'Used as the site name in link previews.' },
          { name: 'general.logoText', label: 'Logo text', type: 'text', maxLength: 40, help: 'Shown when no logo image is set.' },
          { name: 'general.logo', label: 'Logo image (optional)', type: 'image', span: 2, help: 'Transparent PNG/WebP, about 240×64.' },
        ],
      },
      {
        title: 'Favicon',
        fields: [{ name: 'general.favicon', label: 'Favicon', type: 'favicon', span: 2 }],
      },
      {
        title: 'Welcome assistant',
        description:
          'A friendly animated robot that greets visitors and later offers a few helpful tips (projects, contact, CV, thanks). Each tip shows at most once per visit, never while someone is typing, and the robot enters from a different side each time.',
        fields: [
          { name: 'welcome.enabled', label: 'Show the assistant', type: 'switch' },
          { name: 'welcome.followUps', label: 'Show follow-up tips after the greeting', type: 'switch' },
          { name: 'welcome.title', label: 'Greeting title', type: 'text', maxLength: 60, placeholder: 'Hello there! 👋' },
          { name: 'welcome.message', label: 'Greeting message', type: 'textarea', rows: 2, maxLength: 160, span: 2 },
          { name: 'welcome.projectsMessage', label: 'Tip · 25 s in, if Projects not seen yet', type: 'textarea', rows: 2, maxLength: 160, span: 2 },
          { name: 'welcome.contactMessage', label: 'Tip · when the visitor reaches Contact', type: 'textarea', rows: 2, maxLength: 160, span: 2 },
          { name: 'welcome.cvMessage', label: 'Tip · when the visitor is about to leave (CV)', type: 'textarea', rows: 2, maxLength: 160, span: 2 },
          { name: 'welcome.thanksMessage', label: 'Tip · when the visitor reaches the end', type: 'textarea', rows: 2, maxLength: 160, span: 2 },
        ],
      },
      {
        title: 'Footer',
        fields: [
          { name: 'footer.text', label: 'Footer text', type: 'textarea', rows: 2, maxLength: 300, span: 2 },
          { name: 'footer.showSocials', label: 'Show social links in footer', type: 'switch' },
        ],
      },
    ],
  },
  appearance: {
    label: 'Appearance',
    groups: [
      {
        title: 'Theme',
        description: 'The primary colour is used for buttons, links and accents. Text colour on buttons adapts automatically for contrast.',
        fields: [
          { name: 'theme.primaryColor', label: 'Primary colour', type: 'color', help: `Suggestions: ${PRESETS.join(', ')}` },
          {
            name: 'theme.defaultTheme',
            label: 'Default theme',
            type: 'select',
            required: true,
            options: [
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'Follow visitor’s system' },
            ],
          },
          { name: 'theme.allowToggle', label: 'Let visitors switch light/dark theme', type: 'switch' },
        ],
      },
    ],
  },
  hero: {
    label: 'Hero & CTAs',
    groups: [
      {
        title: 'Hero section',
        description: 'Your name, title, photo and introduction are edited under Profile.',
        fields: [
          { name: 'hero.greeting', label: 'Greeting', type: 'text', maxLength: 80, placeholder: "Hi, I'm" },
          { name: 'hero.ctaProjectsLabel', label: '“Projects” button label', type: 'text', maxLength: 40, help: 'Leave empty to hide the button.' },
          { name: 'hero.ctaCvLabel', label: '“Download CV” button label', type: 'text', maxLength: 40, help: 'Leave empty to hide the button.' },
          { name: 'hero.ctaContactLabel', label: '“Contact” button label', type: 'text', maxLength: 40, help: 'Leave empty to hide the button.' },
          { name: 'hero.showSocials', label: 'Show social links in hero', type: 'switch' },
        ],
      },
    ],
  },
  seo: {
    label: 'SEO',
    groups: [
      {
        title: 'Search & social previews',
        description: 'Controls the page title, meta description, Open Graph/Twitter cards, canonical URL, sitemap and robots.txt.',
        folder: 'branding',
        fields: [
          { name: 'seo.title', label: 'Meta title', type: 'text', maxLength: 120, span: 2, help: 'Recommended 50–60 characters.' },
          { name: 'seo.description', label: 'Meta description', type: 'textarea', rows: 3, maxLength: 320, span: 2, help: 'Recommended 140–160 characters.' },
          { name: 'seo.keywords', label: 'Keywords', type: 'tags', span: 2 },
          { name: 'seo.siteUrl', label: 'Website URL (canonical)', type: 'url', help: 'Your production domain, e.g. https://onik.dev' },
          { name: 'seo.twitterHandle', label: 'X / Twitter handle', type: 'text', maxLength: 40, placeholder: '@username' },
          { name: 'seo.ogImage', label: 'Social share image', type: 'ogimage', span: 2 },
          { name: 'seo.indexable', label: 'Allow search engines to index the website', type: 'switch' },
        ],
      },
    ],
  },
  sections: {
    label: 'Sections',
    groups: [
      {
        title: 'Page sections',
        description: 'Reorder sections, enable/disable them, choose which appear in the navigation and rename their headings.',
        fields: [{ name: 'sections', label: 'Sections', type: 'custom', span: 2, render: () => <SectionsEditor /> }],
      },
    ],
  },
};

/** Favicon / OG image fields store a plain URL string – adapt them to the image field. */
function adaptFields(groups) {
  return groups.map((g) => ({
    ...g,
    fields: g.fields.map((f) =>
      f.type === 'favicon'
        ? { ...f, type: 'imageUrl', purpose: 'icon', folder: 'branding', help: 'Square PNG, ICO or WebP (at least 64×64). Resized to 256×256.' }
        : f.type === 'ogimage'
          ? { ...f, type: 'imageUrl', folder: 'branding', help: 'Recommended 1200×630. Defaults to your profile photo.' }
          : f,
    ),
  }));
}

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  return (
    <>
      <PageHeader title="Website Settings" description="Branding, theme, SEO and section visibility. Changes are saved as a draft until you publish." />
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1" role="tablist" aria-label="Settings">
        {Object.entries(TABS).map(([key, t]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn('shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors', tab === key ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        <SingletonForm key={tab} singleton="settings" groups={adaptFields(TABS[tab].groups)} />
      </div>
    </>
  );
}
