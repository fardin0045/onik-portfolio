import { BadgeCheck, ExternalLink } from 'lucide-react';
import { Img } from '../components/ui/Img.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { SectionShell } from './SectionShell.jsx';

export default function Certifications({ site, section }) {
  return (
    <SectionShell section={section} alt>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {site.certifications.map((c, i) => (
          <Reveal as="li" key={c.id} delay={(i % 3) * 80} className="card spotlight transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong flex flex-col overflow-hidden">
            {c.image?.url && (
              <Img src={c.image.url} alt={c.image.alt || `${c.name} certificate`} width={640} className="aspect-[16/10] w-full border-b border-border object-cover" />
            )}
            <div className="flex flex-1 flex-col p-6">
              <BadgeCheck className="size-6 text-primary-ink" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold">{c.name}</h3>
              <p className="mt-1 text-sm text-muted">{c.issuer}</p>
              <p className="mt-1 font-mono text-xs text-subtle">
                {[c.issueDate && `Issued ${c.issueDate}`, c.expiryDate && `Expires ${c.expiryDate}`].filter(Boolean).join(' · ')}
              </p>
              {c.credentialId && <p className="mt-1 font-mono text-xs text-subtle">ID: {c.credentialId}</p>}
              {c.credentialUrl && (
                <a
                  href={c.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-primary-ink hover:underline"
                >
                  Verify credential <ExternalLink className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">for {c.name}</span>
                </a>
              )}
            </div>
          </Reveal>
        ))}
      </ul>
    </SectionShell>
  );
}
