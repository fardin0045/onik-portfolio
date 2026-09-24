import { Award, GraduationCap } from 'lucide-react';
import { Img } from '../components/ui/Img.jsx';
import { Markdown } from '../components/ui/Markdown.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { dateRange } from '../lib/utils.js';
import { SectionShell } from './SectionShell.jsx';

export default function Education({ site, section }) {
  return (
    <SectionShell section={section} alt>
      <ul className="grid gap-5 md:grid-cols-2">
        {site.education.map((e, i) => (
          <Reveal as="li" key={e.id} delay={i * 80} className="card spotlight transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong flex flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              {e.logo?.url ? (
                <Img src={e.logo.url} alt={e.logo.alt || `${e.institution} logo`} width={96} className="size-12 rounded-xl border border-border bg-white object-contain p-1" />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                  <GraduationCap className="size-6" aria-hidden="true" />
                </span>
              )}
              {(e.startDate || e.endDate) && <span className="font-mono text-xs text-subtle">{dateRange(e.startDate, e.endDate)}</span>}
            </div>
            <h3 className="mt-5 text-lg font-semibold">{e.degree}</h3>
            {e.field && <p className="mt-0.5 text-sm font-medium text-primary-ink">{e.field}</p>}
            <p className="mt-2 text-sm text-muted">
              {e.institution}
              {e.location && <span className="text-subtle"> · {e.location}</span>}
            </p>
            {e.description && <Markdown className="mt-3 text-sm">{e.description}</Markdown>}
            {e.result && (
              <p className="mt-auto pt-5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm font-medium text-fg">
                  <Award className="size-4 text-primary-ink" aria-hidden="true" /> {e.result}
                </span>
              </p>
            )}
          </Reveal>
        ))}
      </ul>
    </SectionShell>
  );
}
