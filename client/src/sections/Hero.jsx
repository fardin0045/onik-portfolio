import { ArrowRight, Download, MapPin, Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button.jsx';
import { CountUp } from '../components/ui/CountUp.jsx';
import { SocialLinks } from '../components/ui/SocialIcon.jsx';
import { TechMarquee } from '../components/ui/TechMarquee.jsx';
import { ScrambleText } from '../components/ui/ScrambleText.jsx';
import { TypeCycle } from '../components/ui/TypeCycle.jsx';
import { resumeHref } from '../lib/utils.js';
import { HeroPortrait, topTechnologies } from './HeroPortrait.jsx';

/** Staggered entrance helper: each block rises in 90 ms after the previous one. */
const rise = (i) => ({ className: 'rise', style: { '--d': `${i * 90}ms` } });

/**
 * Tracks the pointer over the hero as CSS variables (rAF-throttled, no React re-renders):
 * --hx/--hy (percent, for the spotlight + glowing grid) and --px/--py (-0.5…0.5, for tilt/parallax).
 * Skipped on touch devices and with reduced motion.
 */
function usePointerVars(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches) return undefined;
    let frame = 0;
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--hx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--hy', `${(y * 100).toFixed(1)}%`);
        el.style.setProperty('--px', (x - 0.5).toFixed(3));
        el.style.setProperty('--py', (y - 0.5).toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(frame);
    };
  }, [ref]);
}

/**
 * "Magnetic" buttons: elements marked data-magnetic inside the hero lean towards the cursor while it
 * is over them and spring back when it leaves. Desktop only; off with reduced motion.
 */
function useMagnetic(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches) return undefined;
    const items = [...root.querySelectorAll('[data-magnetic]')];
    const cleanups = items.map((el) => {
      const onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate3d(${(x * 0.22).toFixed(1)}px, ${(y * 0.3).toFixed(1)}px, 0)`;
      };
      const onLeave = () => {
        el.style.transform = '';
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      return () => {
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
      };
    });
    return () => cleanups.forEach((fn) => fn());
  }, [ref]);
}

// Known time zones for the location chip (recruiters abroad see the local time at a glance).
const TIME_ZONES = [[/dhaka|bangladesh/i, 'Asia/Dhaka']];

/** Current local time ("11:28 AM") for the profile location, refreshed every 30 s; null if unknown. */
function useLocalTime(location) {
  const zone = TIME_ZONES.find(([re]) => re.test(location || ''))?.[1];
  const format = () => new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone }).format(new Date());
  const [time, setTime] = useState(() => (zone ? format() : null));
  useEffect(() => {
    if (!zone) return undefined;
    const id = setInterval(() => setTime(format()), 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);
  return time;
}

/** Name revealed letter by letter from behind a mask; the shimmer then ripples across the letters. */
function RevealName({ name }) {
  return (
    <>
      <span className="sr-only">{name}</span>
      <span aria-hidden="true">
        {[...name].map((ch, i) => (
          <span key={i} className="name-letter-mask">
            <span className="name-letter" style={{ '--i': i }}>
              {ch === ' ' ? '\u00a0' : ch}
            </span>
          </span>
        ))}
      </span>
    </>
  );
}

/** Light pulses travelling along a few lines of the 56 px background grid. */
function GridBeams() {
  return (
    <div className="grid-beams" aria-hidden="true">
      <span className="grid-beam grid-beam-h" style={{ top: 56 * 2, '--dur': '7s', '--delay': '0s' }} />
      <span className="grid-beam grid-beam-h" style={{ top: 56 * 6, '--dur': '9s', '--delay': '3.5s' }} />
      <span className="grid-beam grid-beam-v" style={{ left: 56 * 4, '--dur': '6s', '--delay': '1.5s' }} />
      <span className="grid-beam grid-beam-v" style={{ left: 56 * 15, '--dur': '8s', '--delay': '5s' }} />
      <span className="grid-beam grid-beam-v" style={{ left: 56 * 24, '--dur': '7s', '--delay': '2.5s' }} />
    </div>
  );
}

export function Hero({ site }) {
  const { profile, settings, socialLinks = [], projects = [], skills = [] } = site;
  const hero = settings.hero;
  const heroLinks = socialLinks.filter((l) => l.showInHero !== false);
  const stack = useMemo(() => topTechnologies(skills, 6), [skills]);
  const sectionRef = useRef(null);
  usePointerVars(sectionRef);
  useMagnetic(sectionRef);
  const localTime = useLocalTime(profile.location);

  return (
    <section ref={sectionRef} id="hero" aria-labelledby="hero-heading" className="hero relative overflow-hidden">
      {/* Background: soft brand-colour light, base grid with travelling light beams, a grid that lights up
          under the cursor, cursor spotlight */}
      <div className="hero-glow" aria-hidden="true" />
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <GridBeams />
      <div className="hero-grid-glow" aria-hidden="true" />
      <div className="hero-spotlight" aria-hidden="true" />

      <div className="container-page grid items-center gap-12 pt-10 pb-12 sm:gap-14 sm:pt-14 lg:grid-cols-[1.25fr_1fr] lg:gap-8 lg:pt-14 lg:pb-20 xl:gap-16">
        <div className="hero-exit order-2 text-center lg:order-1 lg:text-left">
          <div {...rise(0)} className="rise mb-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {profile.availability && (
              <span className="chip chip-glow border-success/40 bg-success/10 text-success">
                <span className="pulse-dot size-1.5 rounded-full bg-success" aria-hidden="true" />
                {profile.availability}
              </span>
            )}
            {profile.location && (
              <span className="chip border-border-strong bg-surface/70 backdrop-blur">
                <MapPin className="size-3.5 text-primary-ink" aria-hidden="true" />
                {profile.location}
                {localTime && (
                  <>
                    <span className="text-subtle" aria-hidden="true">
                      ·
                    </span>
                    <time className="font-mono text-fg/80 tabular-nums">{localTime}</time>
                  </>
                )}
              </span>
            )}
          </div>

          <h1 id="hero-heading" className="text-5xl leading-[1.02] font-semibold sm:text-6xl lg:text-[5.25rem]">
            {hero.greeting && (
              <span {...rise(1)} className="rise block text-2xl font-medium tracking-normal text-muted sm:text-3xl">
                {hero.greeting} <span className="wave inline-block" aria-hidden="true">👋</span>
              </span>
            )}
            <span {...rise(2)} className="rise relative mt-1 inline-block pb-3">
              <RevealName name={profile.name} />
              {/* Hand-drawn underline that draws itself after the name appears */}
              <svg className="name-underline" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true">
                <path d="M4 14 C 60 4, 130 4, 180 10 S 270 16, 296 6" pathLength="1" />
              </svg>
            </span>
          </h1>
          {profile.title && (
            <p {...rise(3)} className="rise mt-4 flex items-center justify-center gap-3 text-xl font-medium text-primary-ink sm:text-2xl lg:justify-start">
              <span className="hidden h-px w-8 bg-primary/60 lg:block" aria-hidden="true" />
              <ScrambleText text={profile.title} delay={700} duration={1300} />
            </p>
          )}
          {stack.length > 1 && (
            <p {...rise(4)} className="rise mt-3 font-mono text-sm text-muted sm:text-base">
              <span className="text-success" aria-hidden="true">
                ❯{' '}
              </span>
              building with <TypeCycle words={stack} className="font-semibold text-primary-ink" />
            </p>
          )}
          {profile.shortIntro && (
            <p {...rise(5)} className="rise mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg lg:mx-0 text-justify">
              {profile.shortIntro}
            </p>
          )}

          <div {...rise(6)} className="rise mx-auto mt-8 grid max-w-md grid-cols-2 gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:justify-center lg:justify-start">
            {projects.length > 0 && hero.ctaProjectsLabel && (
              <Button
                href="#projects"
                data-magnetic
                size="lg"
                className="btn-shine group w-full shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 sm:w-auto"
              >
                {hero.ctaProjectsLabel} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            )}
            {profile.resume?.url && hero.ctaCvLabel && (
              <Button
                href={resumeHref(profile)}
                target="_blank"
                rel="noopener noreferrer"
                data-magnetic
                size="lg"
                variant="secondary"
                className="group w-full hover:-translate-y-0.5 hover:border-primary/50 sm:w-auto"
              >
                <Download className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" /> {hero.ctaCvLabel}
              </Button>
            )}
            {hero.ctaContactLabel && (
              <Button href="#contact" data-magnetic size="lg" variant="ghost" className="group col-span-2 w-full sm:w-auto">
                <Send className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" /> {hero.ctaContactLabel}
              </Button>
            )}
          </div>

          {hero.showSocials && heroLinks.length > 0 && (
            <div {...rise(7)} className="rise mt-9 flex items-center justify-center gap-4 lg:justify-start">
              <span className="hidden font-mono text-xs tracking-widest text-subtle uppercase sm:inline">Find me on</span>
              <span className="hidden h-px w-8 bg-border-strong sm:block" aria-hidden="true" />
              <SocialLinks links={heroLinks} itemClassName="hover:-translate-y-0.5 transition-all" />
            </div>
          )}

        </div>

        <div {...rise(2)} className="rise order-1 mx-auto w-full max-w-[260px] sm:max-w-[300px] lg:order-2 lg:self-start lg:max-w-[360px] xl:max-w-[400px]">
          <div className="hero-exit-slow">
            <HeroPortrait profile={profile} skills={skills} />
          </div>
        </div>
      </div>

      {profile.highlights?.length > 0 && (
        <div {...rise(8)} className="rise container-page pb-8">
          <dl className="hero-stats grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-surface/60 backdrop-blur">
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

      <div {...rise(9)} className="rise pb-4 sm:pb-8">
        <TechMarquee skills={skills} />
      </div>
    </section>
  );
}
