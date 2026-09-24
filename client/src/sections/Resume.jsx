import { Download, Eye, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { formatDate, resumeHref } from '../lib/utils.js';

export default function Resume({ site, section }) {
  const { resume, name } = site.profile;
  const url = resumeHref(site.profile);
  const downloadUrl = resumeHref(site.profile, { download: true });
  return (
    <section id={section.key} aria-labelledby="resume-heading" className="scroll-mt-20 py-16 sm:py-20">
      <div className="container-page">
        <Reveal className="card relative overflow-hidden p-6 sm:p-10">
          <div
            className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(closest-side, var(--primary), transparent)' }}
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-ink sm:flex">
                <FileText className="size-7" aria-hidden="true" />
              </span>
              <div>
                {section.eyebrow && <p className="eyebrow">{section.eyebrow}</p>}
                <h2 id="resume-heading" className="mt-2 text-2xl font-semibold sm:text-3xl">
                  {section.title}
                </h2>
                {section.subtitle && <p className="mt-2 text-muted">{section.subtitle}</p>}
                {resume.updatedAt && <p className="mt-1 font-mono text-xs text-subtle">Last updated {formatDate(resume.updatedAt)}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <Button href={url} target="_blank" rel="noopener noreferrer" size="lg" variant="secondary" className="order-2 w-full sm:order-1 sm:w-auto">
                <Eye className="size-4" aria-hidden="true" /> View online
              </Button>
              <Button href={downloadUrl} download={resume.fileName || `${name}-CV.pdf`} size="lg" className="order-1 w-full sm:order-2 sm:w-auto">
                <Download className="size-4" aria-hidden="true" /> Download CV
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
