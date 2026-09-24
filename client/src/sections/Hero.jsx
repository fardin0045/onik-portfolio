import { ArrowRight, Download, MapPin, Send } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { CountUp } from '../components/ui/CountUp.jsx';
import { SocialLinks } from '../components/ui/SocialIcon.jsx';
import { TechMarquee } from '../components/ui/TechMarquee.jsx';
import { mediaUrl } from '../lib/utils.js';
import { HeroPortrait } from './HeroPortrait.jsx';

/** Staggered entrance helper: each block rises in 90 ms after the previous one. */
const rise = (i) => ({ className: 'rise', style: { '--d': `${i * 90}ms` } });

export function Hero({ site }) {
  const { profile, settings, socialLinks = [], projects = [], skills = [] } = site;
  const hero = settings.hero;
  const heroLinks = socialLinks.filter((l) => l.showInHero !== false);

  return (
    <section id="hero" aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-48 left-1/2 -z-10 h-[520px] w-[1000px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--primary), transparent)' }}
        aria-hidden="true"
      />

      <div className="container-page grid items-center gap-12 pt-10 pb-12 sm:gap-14 sm:pt-14 lg:grid-cols-[1.25fr_1fr] lg:gap-8 lg:pt-20 lg:pb-20 xl:gap-16">
        <div className="order-2 text-center lg:order-1 lg:text-left">
          <div {...rise(0)} className="rise mb-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {profile.availability && (
              <span className="chip border-success/30 bg-success/10 text-success">
                <span className="pulse-dot size-1.5 rounded-full bg-success" aria-hidden="true" />
                {profile.availability}
              </span>
            )}
            {profile.location && (
              <span className="chip border-border-strong">
                <MapPin className="size-3.5 text-primary-ink" aria-hidden="true" />
                {profile.location}
              </span>
            )}
          </div>

          <h1 id="hero-heading" className="text-4xl leading-[1.05] font-semibold sm:text-5xl lg:text-[4rem]">
            {hero.greeting && (
              <span {...rise(1)} className="rise block text-2xl font-medium text-muted sm:text-3xl">
                {hero.greeting}
              </span>
            )}
            <span {...rise(2)} className="rise mt-1 block bg-gradient-to-br from-fg via-fg to-fg/60 bg-clip-text text-transparent">
              {profile.name}
            </span>
          </h1>
          {profile.title && (
            <p {...rise(3)} className="rise mt-4 flex items-center justify-center gap-3 text-xl font-medium text-primary-ink sm:text-2xl lg:justify-start">
              <span className="hidden h-px w-8 bg-primary/60 lg:block" aria-hidden="true" />
              {profile.title}
            </p>
          )}
          {profile.shortIntro && (
            <p {...rise(4)} className="rise mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0">
              {profile.shortIntro}
            </p>
          )}

          <div {...rise(5)} className="rise mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center lg:justify-start">
            {projects.length > 0 && hero.ctaProjectsLabel && (
              <Button href="#projects" size="lg" className="group w-full shadow-lg shadow-primary/20 sm:w-auto">
                {hero.ctaProjectsLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Button>
            )}
            {profile.resume?.url && hero.ctaCvLabel && (
              <Button href={mediaUrl(profile.resume.url)} target="_blank" rel="noopener noreferrer" size="lg" variant="secondary" className="group w-full sm:w-auto">
                <Download className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" /> {hero.ctaCvLabel}
              </Button>
            )}
            {hero.ctaContactLabel && (
              <Button href="#contact" size="lg" variant="ghost" className="group col-span-2 w-full sm:w-auto">
                <Send className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /> {hero.ctaContactLabel}
              </Button>
            )}
          </div>

          {hero.showSocials && heroLinks.length > 0 && (
            <div {...rise(6)} className="rise mt-9 flex items-center justify-center gap-4 lg:justify-start">
              <span className="hidden font-mono text-xs tracking-widest text-subtle uppercase sm:inline">Find me on</span>
              <span className="hidden h-px w-8 bg-border-strong sm:block" aria-hidden="true" />
              <SocialLinks links={heroLinks} itemClassName="hover:-translate-y-0.5 transition-all" />
            </div>
          )}
        </div>

        <div {...rise(2)} className="rise order-1 mx-auto w-full max-w-[260px] sm:max-w-[300px] lg:order-2 lg:max-w-[360px] xl:max-w-[400px]">
          <HeroPortrait profile={profile} skills={skills} />
        </div>
      </div>

      {profile.highlights?.length > 0 && (
        <div {...rise(7)} className="rise container-page pb-8">
          <dl className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-surface/60 backdrop-blur">
            {profile.highlights.map((h) => (
              <div key={`${h.value}-${h.label}`} className="spotlight flex flex-col items-center gap-1 px-2 py-4 text-center sm:items-start sm:px-6 sm:py-5 sm:text-left">
                <dt className="order-2 text-[0.7rem] leading-snug text-muted sm:text-sm">{h.label}</dt>
                <dd className="order-1 font-mono text-xl font-semibold text-fg tabular-nums sm:text-3xl">
                  <CountUp value={h.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div {...rise(8)} className="rise pb-4 sm:pb-8">
        <TechMarquee skills={skills} />
      </div>
    </section>
  );
}
