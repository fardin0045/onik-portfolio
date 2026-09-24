import { GraduationCap } from 'lucide-react';
import { Img } from '../components/ui/Img.jsx';
import { hasTechIcon, TechIcon } from '../components/ui/TechIcon.jsx';

const PREFERRED = ['React.js', 'React', 'Node.js', 'MongoDB', 'Express.js', 'Tailwind CSS', 'JavaScript'];
// Badge positions around the arch (percent of the portrait box) + float timing.
const SLOTS = [
  { top: '14%', left: '-4%', delay: '0s' },
  { top: '30%', right: '-4%', delay: '1.2s' },
  { top: '62%', left: '-6%', delay: '2.1s' },
  { top: '72%', right: '-3%', delay: '0.6s' },
];

function pickBadges(skills) {
  const names = skills.map((s) => s.name);
  const preferred = PREFERRED.filter((n) => names.includes(n));
  const rest = names.filter((n) => !preferred.includes(n) && hasTechIcon(n) && !/concept|core/i.test(skills.find((s) => s.name === n)?.category || ''));
  return [...new Set([...preferred, ...rest])].slice(0, SLOTS.length);
}

/**
 * Hero portrait: a glowing arch with a rotating light ring. With a background-removed
 * photo (Profile → "Hero cut-out photo") the portrait "pops out" of the arch; otherwise
 * the regular profile photo is shown framed inside it. Floating badges show the
 * top technologies from Skills.
 */
export function HeroPortrait({ profile, skills }) {
  const cutout = profile.heroImage?.url;
  const photo = cutout ? profile.heroImage : profile.avatar;
  const badges = pickBadges(skills);
  const initials = profile.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="relative mx-auto aspect-[4/5] w-full">
      {/* Ambient glow */}
      <div
        className="absolute inset-x-[-12%] top-[4%] bottom-[-6%] -z-10 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, color-mix(in oklab, var(--primary) 55%, transparent), transparent)' }}
        aria-hidden="true"
      />

      {/* Arch */}
      <div className="photo-ring absolute inset-x-0 top-[14%] bottom-0 rounded-t-[999px] rounded-b-[2rem]">
        <div className="absolute inset-0 overflow-hidden rounded-t-[999px] rounded-b-[2rem] border border-border-strong bg-surface">
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(120% 80% at 50% 20%, color-mix(in oklab, var(--primary) 38%, var(--surface)), var(--surface) 70%)' }}
            aria-hidden="true"
          />
          <div className="bg-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_50%_30%,#000_20%,transparent_70%)]" aria-hidden="true" />
          {/* Concentric rings */}
          <div className="absolute top-[18%] left-1/2 aspect-square w-[78%] -translate-x-1/2 rounded-full border border-fg/10" aria-hidden="true" />
          <div className="absolute top-[6%] left-1/2 aspect-square w-[104%] -translate-x-1/2 rounded-full border border-fg/5" aria-hidden="true" />
          {!cutout && (
            <Img
              src={photo?.url}
              alt={photo?.alt || `Portrait of ${profile.name}`}
              width={800}
              sizes="(min-width: 1024px) 384px, 320px"
              priority
              className="absolute inset-0 size-full object-cover object-top"
              fallback={
                <div className="absolute inset-0 flex items-center justify-center text-6xl font-semibold text-subtle" aria-hidden="true">
                  {initials}
                </div>
              }
            />
          )}
        </div>
      </div>

      {/* Cut-out portrait pops out of the arch (head overlaps the top edge) */}
      {cutout && (
        <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden rounded-b-[2rem]">
          <Img
            src={photo.url}
            alt={photo.alt || `Portrait of ${profile.name}`}
            width={900}
            sizes="(min-width: 1024px) 460px, 360px"
            priority
            className="portrait-cutout absolute bottom-0 left-1/2 w-[118%] max-w-none -translate-x-1/2"
          />
        </div>
      )}

      {/* Floating technology badges */}
      {badges.map((name, i) => {
        const { delay, ...pos } = SLOTS[i];
        return (
          <div key={name} className="absolute z-10 hidden sm:block" style={pos}>
            <div
              className="float-y group flex items-center gap-2 rounded-2xl border border-border-strong bg-surface/90 p-2.5 shadow-xl shadow-black/25 backdrop-blur-md transition-transform hover:scale-110"
              style={{ animationDelay: delay }}
              title={name}
            >
              <TechIcon name={name} className="size-6" colored />
              <span className="sr-only">{name}</span>
            </div>
          </div>
        );
      })}

      {profile.headline && (
        <div className="absolute -bottom-6 left-1/2 z-10 w-max max-w-[calc(100%+2.5rem)] -translate-x-1/2">
          <div className="float-y flex items-center gap-2.5 rounded-2xl border border-border-strong bg-surface/95 px-4 py-2.5 shadow-xl shadow-black/25 backdrop-blur" style={{ animationDelay: '0.9s' }}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-ink">
              <GraduationCap className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs leading-snug font-medium text-fg sm:text-sm">{profile.headline}</span>
          </div>
        </div>
      )}
    </div>
  );
}
