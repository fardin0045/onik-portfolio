import { Suspense, useEffect } from 'react';
import { useLocation } from 'react-router';
import { useSite } from '../components/layout/PublicLayout.jsx';
import { Skeleton } from '../components/ui/Feedback.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { mediaUrl } from '../lib/utils.js';
import { SECTION_REGISTRY, visibleSections } from '../sections/registry.js';

function SectionFallback() {
  return (
    <div className="container-page py-20" aria-hidden="true">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-8 h-48 w-full" />
    </div>
  );
}

export default function Home() {
  const site = useSite();
  const { profile, settings, socialLinks } = site;
  const { hash } = useLocation();

  const siteUrl = (settings.seo.siteUrl || window.location.origin).replace(/\/$/, '');
  useDocumentMeta({
    title: settings.seo.title || [profile.name, profile.title].filter(Boolean).join(' — '),
    description: settings.seo.description || profile.shortIntro,
    image: settings.seo.ogImage || profile.avatar?.url,
    siteName: settings.general.siteTitle,
    url: `${siteUrl}/`,
    noindex: !settings.seo.indexable || site.preview,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.name,
      jobTitle: profile.title || undefined,
      description: profile.shortIntro || undefined,
      image: profile.avatar?.url ? new URL(mediaUrl(profile.avatar.url), window.location.origin).href : undefined,
      url: siteUrl,
      address: profile.location ? { '@type': 'PostalAddress', addressLocality: profile.location } : undefined,
      alumniOf: site.education.map((e) => ({ '@type': 'EducationalOrganization', name: e.institution })),
      knowsAbout: site.skills.slice(0, 20).map((s) => s.name),
      sameAs: socialLinks.filter((l) => /^https?:/.test(l.url)).map((l) => l.url),
    },
  });

  // Support deep links like /#projects (sections are lazy, so wait a tick).
  useEffect(() => {
    if (!hash) return undefined;
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 350);
    return () => clearTimeout(t);
  }, [hash]);

  return visibleSections(site).map((section) => {
    const { component: Component, props } = SECTION_REGISTRY[section.key];
    return (
      <Suspense key={section.key} fallback={<SectionFallback />}>
        <Component site={site} section={section} {...props} />
      </Suspense>
    );
  });
}
