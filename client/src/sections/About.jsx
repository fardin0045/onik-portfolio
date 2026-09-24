import { Briefcase, GraduationCap, Mail, MapPin, Sparkles } from 'lucide-react';
import { Markdown } from '../components/ui/Markdown.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { SectionShell } from './SectionShell.jsx';

export default function About({ site, section }) {
  const { profile, education = [] } = site;
  const edu = education[0];
  const facts = [
    profile.location && { icon: MapPin, label: 'Based in', value: profile.location },
    profile.title && { icon: Briefcase, label: 'Focus', value: profile.title },
    edu && { icon: GraduationCap, label: 'Education', value: [edu.degree, edu.field].filter(Boolean).join(' · '), sub: edu.institution },
    profile.contact.email && { icon: Mail, label: 'Email', value: profile.contact.email, href: `mailto:${profile.contact.email}` },
    profile.availability && { icon: Sparkles, label: 'Availability', value: profile.availability },
  ].filter(Boolean);

  return (
    <SectionShell section={section}>
      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
        <Reveal>
          <Markdown className="max-w-3xl text-base leading-8 sm:text-[1.05rem]">{profile.bio || profile.careerObjective}</Markdown>
        </Reveal>
        {facts.length > 0 && (
          <Reveal delay={100}>
            <dl className="card grid gap-px overflow-hidden bg-border sm:grid-cols-2 lg:grid-cols-1">
              {facts.map(({ icon: Icon, label, value, sub, href }) => (
                <div key={label} className="flex gap-4 bg-surface p-5 sm:last:odd:col-span-2 lg:last:odd:col-span-1">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium tracking-wide text-subtle uppercase">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium break-words text-fg">
                      {href ? (
                        <a href={href} className="link-underline">
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                      {sub && <span className="mt-0.5 block text-sm font-normal text-muted">{sub}</span>}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </div>
    </SectionShell>
  );
}
