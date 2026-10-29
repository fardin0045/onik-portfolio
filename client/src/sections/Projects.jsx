import { useEffect, useMemo, useState } from 'react';
import { Reveal } from '../hooks/useReveal.jsx';
import { cn } from '../lib/utils.js';
import { ProjectCard } from './ProjectCard.jsx';
import { SectionShell } from './SectionShell.jsx';

const MIN_PROJECTS_FOR_FILTER = 4;
// "React.js" and "React" (or "Node" / "Node.js") are the same filter.
const norm = (t = '') => t.toLowerCase().replace(/\.?js$/, '').trim();

export default function Projects({ site, section }) {
  const [filter, setFilter] = useState('All');

  const projects = useMemo(
    () => [...site.projects].sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order),
    [site.projects],
  );

  // Filter chips: categories + the most used technologies (only when there are enough projects).
  const filters = useMemo(() => {
    if (projects.length < MIN_PROJECTS_FOR_FILTER) return [];
    const counts = new Map(); // normalised key -> { label, n }
    projects.forEach((p) => {
      const keys = new Map([p.category, ...(p.technologies || [])].filter(Boolean).map((t) => [norm(t), t]));
      keys.forEach((label, key) => counts.set(key, { label: counts.get(key)?.label || label, n: (counts.get(key)?.n || 0) + 1 }));
    });
    const useful = [...counts.values()].filter(({ n }) => n >= 2 && n < projects.length).sort((a, b) => b.n - a.n).slice(0, 8);
    return useful.length ? ['All', ...useful.map(({ label }) => label)] : [];
  }, [projects]);

  // The hero's technology badges ask for a filter via a window event ("projects:filter").
  useEffect(() => {
    const onFilter = (e) => setFilter(filters.find((f) => norm(f) === norm(e.detail)) || 'All');
    window.addEventListener('projects:filter', onFilter);
    return () => window.removeEventListener('projects:filter', onFilter);
  }, [filters]);

  const shown = filter === 'All' ? projects : projects.filter((p) => [p.category, ...(p.technologies || [])].some((t) => t && norm(t) === norm(filter)));

  // Never leave a half-empty last row: when the count doesn't divide evenly into the
  // columns, the first project spans wider and switches to a horizontal "featured" layout.
  const count = shown.length;
  const leadSpan = cn(
    count > 1 && count % 2 === 1 ? 'sm:col-span-2' : count === 1 && 'sm:col-span-2',
    count === 1 || count % 3 === 1 ? 'lg:col-span-3' : count % 3 === 2 ? 'lg:col-span-2' : 'lg:col-span-1',
  );

  return (
    <SectionShell section={section}>
      {filters.length > 0 && (
        <div className="-mx-4 -mt-2 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden" role="group" aria-label="Filter projects">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                filter === f ? 'border-primary bg-primary-soft text-primary-ink' : 'border-border text-muted hover:border-border-strong hover:text-fg',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      )}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
        {shown.map((p, i) => (
          <Reveal as="li" key={p.id} delay={(i % 3) * 80} className={cn('@container', i === 0 && leadSpan)}>
            <ProjectCard project={p} />
          </Reveal>
        ))}
      </ul>
    </SectionShell>
  );
}
