import { Quote } from 'lucide-react';
import { Img } from '../components/ui/Img.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { SectionShell } from './SectionShell.jsx';

export default function Testimonials({ site, section }) {
  return (
    <SectionShell section={section}>
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {site.testimonials.map((t, i) => (
          <Reveal as="li" key={t.id} delay={(i % 3) * 80}>
            <figure className="card flex h-full flex-col p-6">
              <Quote className="size-6 text-primary-ink" aria-hidden="true" />
              <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-fg/90">“{t.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Img
                  src={t.avatar?.url}
                  alt=""
                  width={96}
                  className="size-10 rounded-full object-cover"
                  fallback={
                    <span className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-muted" aria-hidden="true">
                      {t.name[0]}
                    </span>
                  }
                />
                <div className="text-sm">
                  <p className="font-semibold text-fg">
                    {t.url ? (
                      <a href={t.url} target="_blank" rel="noopener noreferrer" className="link-underline">
                        {t.name}
                      </a>
                    ) : (
                      t.name
                    )}
                  </p>
                  <p className="text-muted">{[t.role, t.company].filter(Boolean).join(', ')}</p>
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </SectionShell>
  );
}
