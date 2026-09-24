import { Cloud, Code2, Database, Layers, Monitor, Palette, Rocket, Server, ShieldCheck, Smartphone, Sparkles, Wrench } from 'lucide-react';
import { Reveal } from '../hooks/useReveal.jsx';
import { SectionShell } from './SectionShell.jsx';

/** Icon names selectable in Dashboard → Services. */
export const SERVICE_ICONS = { code: Code2, web: Monitor, server: Server, database: Database, mobile: Smartphone, design: Palette, cloud: Cloud, security: ShieldCheck, rocket: Rocket, tools: Wrench, layers: Layers, sparkles: Sparkles };

export default function Services({ site, section }) {
  return (
    <SectionShell section={section} alt>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {site.services.map((s, i) => {
          const Icon = SERVICE_ICONS[s.icon] || Code2;
          return (
            <Reveal as="li" key={s.id} delay={(i % 3) * 80} className="card spotlight transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
            </Reveal>
          );
        })}
      </ul>
    </SectionShell>
  );
}
