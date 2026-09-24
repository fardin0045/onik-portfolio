import { ArrowDown, ArrowUp } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

const HELP = {
  hero: 'Always shown first.',
  experience: 'Hidden automatically until you add work experience.',
  internships: 'Hidden automatically until you add an internship.',
  research: 'Hidden until you add research / thesis items.',
  certifications: 'Hidden until you add certifications.',
  achievements: 'Hidden until you add achievements.',
  services: 'Hidden until you add services.',
  testimonials: 'Hidden until you add testimonials.',
  blog: 'Hidden until you publish an article.',
  resume: 'Shown when a CV is uploaded (Profile → Resume).',
};

/** Reorder sections, toggle visibility / navigation and rename their headings. */
export function SectionsEditor() {
  const { control, register, watch } = useFormContext();
  const { fields, move } = useFieldArray({ control, name: 'sections', keyName: '_key' });
  const values = watch('sections') || [];

  return (
    <ol className="space-y-3">
      {fields.map((s, i) => {
        const isHero = s.key === 'hero';
        const enabled = values[i]?.enabled;
        return (
          <li key={s._key} className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col">
                <button type="button" disabled={i <= 1 || isHero} onClick={() => move(i, i - 1)} className="rounded p-0.5 text-subtle hover:text-fg disabled:opacity-25" aria-label={`Move ${s.key} up`}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" disabled={isHero || i === fields.length - 1} onClick={() => move(i, i + 1)} className="rounded p-0.5 text-subtle hover:text-fg disabled:opacity-25" aria-label={`Move ${s.key} down`}>
                  <ArrowDown className="size-4" />
                </button>
              </div>
              <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-muted">{s.key}</span>
              <div className="ml-auto flex flex-wrap items-center gap-4 text-sm">
                {!isHero && (
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register(`sections.${i}.showInNav`)} />
                    In navigation
                  </label>
                )}
                {isHero ? (
                  <span className="text-xs text-subtle">Always on</span>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 font-medium">
                    <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register(`sections.${i}.enabled`)} />
                    Enabled
                  </label>
                )}
              </div>
            </div>
            {!isHero && (
              <div className={`mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr] ${enabled ? '' : 'opacity-50'}`}>
                <input className="input py-2" placeholder="Eyebrow (small label)" aria-label={`${s.key} eyebrow`} maxLength={40} {...register(`sections.${i}.eyebrow`)} />
                <input className="input py-2" placeholder="Section title" aria-label={`${s.key} title`} maxLength={80} {...register(`sections.${i}.title`)} />
                <input className="input py-2 sm:col-span-2" placeholder="Subtitle (optional)" aria-label={`${s.key} subtitle`} maxLength={300} {...register(`sections.${i}.subtitle`)} />
              </div>
            )}
            {HELP[s.key] && <p className="mt-2 text-xs text-subtle">{HELP[s.key]}</p>}
          </li>
        );
      })}
    </ol>
  );
}
