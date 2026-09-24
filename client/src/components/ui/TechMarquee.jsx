import { hasTechIcon, TechIcon } from './TechIcon.jsx';

/**
 * Infinite, pausable logo strip of the technologies listed under Skills.
 * Pure CSS animation (GPU transform); static wrap when the user prefers reduced motion.
 */
export function TechMarquee({ skills = [] }) {
  const items = [...new Map(skills.filter((s) => hasTechIcon(s.name)).map((s) => [s.name, s])).values()].filter(
    (s) => !/concept|core/i.test(s.category),
  );
  if (items.length < 5) return null;

  const row = (hidden) => (
    <ul className="marquee-track flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {items.map((s) => (
        <li key={s.name} className="group flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 text-sm whitespace-nowrap text-muted backdrop-blur transition-colors hover:border-border-strong hover:text-fg">
          <TechIcon name={s.name} className="size-[18px]" />
          {s.name}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee group/marquee relative flex overflow-hidden" role="region" aria-label="Technologies I work with">
      {row(false)}
      {row(true)}
    </div>
  );
}
