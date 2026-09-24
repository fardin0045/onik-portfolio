import { Reveal } from '../hooks/useReveal.jsx';
import { cn } from '../lib/utils.js';

/** Consistent section wrapper: anchor id, eyebrow, heading, optional subtitle and action. */
export function SectionShell({ section, children, className, action, alt = false }) {
  const headingId = `${section.key}-heading`;
  return (
    <section id={section.key} aria-labelledby={headingId} className={cn('scroll-mt-20 py-16 sm:py-20 lg:py-24', alt && 'bg-surface/40', className)}>
      <div className="container-page">
        <Reveal className="mb-8 flex flex-col gap-4 sm:mb-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            {section.eyebrow && (
              <p className="eyebrow">
                <span className="eyebrow-line h-px w-6 bg-primary" aria-hidden="true" />
                {section.eyebrow}
              </p>
            )}
            <h2 id={headingId} className="mt-3 text-3xl font-semibold sm:text-4xl">
              {section.title}
            </h2>
            {section.subtitle && <p className="mt-3 text-base text-muted sm:text-lg">{section.subtitle}</p>}
          </div>
          {action}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
