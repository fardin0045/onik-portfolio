import { ExternalLink, MapPin } from 'lucide-react';
import { Img } from '../components/ui/Img.jsx';
import { Markdown } from '../components/ui/Markdown.jsx';
import { TechIcon } from '../components/ui/TechIcon.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { dateRange } from '../lib/utils.js';
import { SectionShell } from './SectionShell.jsx';

/** Timeline used for both "Work Experience" and "Internships" (filtered by `type`). */
export default function Experience({ site, section, type = 'work' }) {
  const items = site.experience.filter((e) => (type === 'internship' ? e.type === 'internship' : e.type !== 'internship'));
  return (
    <SectionShell section={section} alt={type === 'work'}>
      <ol className="relative space-y-6 sm:border-l sm:border-border sm:pl-8">
        {items.map((e, i) => (
          <Reveal as="li" key={e.id} delay={i * 60} className="relative">
            <span className="absolute top-7 -left-[39px] hidden size-3 rounded-full border-2 border-primary bg-bg sm:block" aria-hidden="true" />
            <article className="card spotlight p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  {e.logo?.url && (
                    <Img src={e.logo.url} alt={e.logo.alt || `${e.company} logo`} width={96} className="size-12 shrink-0 rounded-xl border border-border bg-white object-contain p-1" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{e.role}</h3>
                    <p className="mt-0.5 text-sm font-medium text-muted">
                      {e.companyUrl ? (
                        <a href={e.companyUrl} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1">
                          {e.company} <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      ) : (
                        e.company
                      )}
                      {e.employmentType && <span className="text-subtle"> · {e.employmentType}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1 text-sm text-subtle sm:items-end">
                  <span className="font-mono text-xs">{dateRange(e.startDate, e.endDate, e.current)}</span>
                  {e.location && (
                    <span className="inline-flex items-center gap-1 text-xs">
                      <MapPin className="size-3" aria-hidden="true" /> {e.location}
                    </span>
                  )}
                </div>
              </div>
              {e.description && <Markdown className="mt-4 text-sm">{e.description}</Markdown>}
              {e.highlights?.length > 0 && (
                <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-muted marker:text-primary-ink">
                  {e.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              {e.technologies?.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Technologies">
                  {e.technologies.map((t) => (
                    <li key={t} className="chip">
                      <TechIcon name={t} className="size-3.5" colored fallback={false} />
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </Reveal>
        ))}
      </ol>
    </SectionShell>
  );
}
