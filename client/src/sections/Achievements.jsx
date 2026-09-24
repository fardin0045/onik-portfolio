import { ExternalLink, Trophy } from 'lucide-react';
import { Markdown } from '../components/ui/Markdown.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { SectionShell } from './SectionShell.jsx';

export default function Achievements({ site, section }) {
  return (
    <SectionShell section={section}>
      <ul className="grid gap-5 md:grid-cols-2">
        {site.achievements.map((a, i) => (
          <Reveal as="li" key={a.id} delay={(i % 2) * 80} className="card spotlight transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong flex gap-5 p-6">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
              <Trophy className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold">{a.title}</h3>
              <p className="mt-0.5 text-sm text-muted">
                {[a.organization, a.date].filter(Boolean).join(' · ')}
              </p>
              {a.description && <Markdown className="mt-3 text-sm">{a.description}</Markdown>}
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink hover:underline">
                  Learn more <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </ul>
    </SectionShell>
  );
}
