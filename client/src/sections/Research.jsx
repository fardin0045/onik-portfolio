import { ExternalLink, FlaskConical } from 'lucide-react';
import { Markdown } from '../components/ui/Markdown.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { SectionShell } from './SectionShell.jsx';

export default function Research({ site, section }) {
  return (
    <SectionShell section={section}>
      <ul className="space-y-5">
        {site.research.map((r, i) => (
          <Reveal as="li" key={r.id} delay={i * 60}>
            <article className="card p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary-ink">
                  <FlaskConical className="size-3.5" aria-hidden="true" /> {r.type || 'Research'}
                </span>
                {r.status && <span className="chip">{r.status}</span>}
                {r.date && <span className="font-mono text-subtle">{r.date}</span>}
              </div>
              <h3 className="mt-4 text-xl font-semibold">{r.title}</h3>
              {(r.institution || r.supervisor) && (
                <p className="mt-1 text-sm text-muted">
                  {r.institution}
                  {r.supervisor && <span className="text-subtle"> · Supervisor: {r.supervisor}</span>}
                </p>
              )}
              {r.abstract && <Markdown className="mt-4 text-sm">{r.abstract}</Markdown>}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                {r.technologies?.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label="Keywords">
                    {r.technologies.map((t) => (
                      <li key={t} className="chip">
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink hover:underline">
                    Read more <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </ul>
    </SectionShell>
  );
}
