import { PageHeader } from '../components/PageHeader.jsx';
import { SingletonForm } from '../components/SingletonForm.jsx';

const today = () => new Date().toISOString().slice(0, 10);

const GROUPS = [
  {
    title: 'Identity',
    description: 'Your name and professional title appear in the hero, page titles and SEO.',
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, maxLength: 80 },
      { name: 'title', label: 'Professional title', type: 'text', maxLength: 120, placeholder: 'Full-Stack Developer' },
      { name: 'headline', label: 'Photo caption / headline', type: 'text', maxLength: 200, span: 2, help: 'Short line shown on the badge under your photo.' },
      { name: 'location', label: 'Location', type: 'text', maxLength: 120 },
      { name: 'availability', label: 'Availability (optional)', type: 'text', maxLength: 120, placeholder: 'Open to internships' },
    ],
  },
  {
    title: 'Profile photo',
    folder: 'profile',
    fields: [
      { name: 'avatar', label: 'Photo', type: 'image', span: 2, help: 'Portrait orientation (4:5) works best. Used in link previews and as the fallback hero image.' },
      {
        name: 'heroImage',
        label: 'Hero cut-out photo (optional)',
        type: 'image',
        span: 2,
        help: 'A PNG/WebP of the same photo with a transparent background. It “pops out” of the hero arch. Leave empty to show the regular photo inside the arch.',
      },
    ],
  },
  {
    title: 'Hero introduction',
    fields: [{ name: 'shortIntro', label: 'Short introduction', type: 'textarea', rows: 4, maxLength: 600, span: 2, help: 'Two or three sentences shown under your name.' }],
  },
  {
    title: 'Highlights',
    description: 'Up to 3–6 short facts displayed under the hero (e.g. CGPA, number of projects).',
    fields: [
      {
        name: 'highlights',
        label: 'Highlights',
        type: 'repeater',
        span: 2,
        max: 6,
        itemLabel: 'highlight',
        fields: [
          { name: 'value', label: 'Value', maxLength: 30 },
          { name: 'label', label: 'Label', maxLength: 80 },
        ],
      },
    ],
  },
  {
    title: 'About me',
    fields: [
      { name: 'bio', label: 'Bio', type: 'markdown', rows: 12, maxLength: 8000, span: 2, help: 'Shown in the About section. Markdown supported.' },
      { name: 'careerObjective', label: 'Career objective', type: 'textarea', rows: 4, maxLength: 1500, span: 2 },
    ],
  },
  {
    title: 'Resume / CV',
    description: 'Used by every “Download CV” button on the website.',
    fields: [
      {
        name: 'resume.url',
        label: 'CV file (PDF)',
        type: 'document',
        folder: 'resume',
        span: 2,
        // A newly uploaded CV automatically gets today's date.
        onUploaded: (_media, { setValue }) => setValue('resume.updatedAt', today(), { shouldDirty: true }),
      },
      { name: 'resume.fileName', label: 'Download file name', type: 'text', maxLength: 160, placeholder: 'Onik_CV.pdf' },
      { name: 'resume.updatedAt', label: 'Last updated', type: 'date' },
    ],
  },
];

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Profile" description="Your personal information, photo, hero text, bio and CV. Changes are saved as a draft until you publish." />
      <SingletonForm singleton="profile" groups={GROUPS} />
    </>
  );
}
