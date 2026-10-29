import { GraduationCap } from 'lucide-react';
import defaultHoverPhoto from '../assets/hero-smile.webp';
import { Img } from '../components/ui/Img.jsx';
import { hasTechIcon, TechIcon } from '../components/ui/TechIcon.jsx';

const PREFERRED = ['React.js', 'React', 'Node.js', 'MongoDB', 'Express.js', 'Tailwind CSS', 'JavaScript'];
// Badge positions around the arch (percent of the portrait box), float timing and parallax depth (px).
const SLOTS = [
  { top: '20%', left: '-6%', delay: '0s', depth: 30 },
  { top: '36%', right: '-6%', delay: '1.2s', depth: 22 },
  { top: '60%', left: '-8%', delay: '2.1s', depth: 26 },
  { top: '74%', right: '-5%', delay: '0.6s', depth: 36 },
];

const BACKDROP_ROWS = [0, 1, 2, 3, 4, 5, 6];

/** Scrolls to Projects and asks it to show only projects built with `tech` (see Projects.jsx). */
function showProjectsWith(tech) {
  window.dispatchEvent(new CustomEvent('projects:filter', { detail: tech }));
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
}

/** The most representative technologies (with a logo) from Skills, core MERN stack first. */
export function topTechnologies(skills, limit) {
  const names = skills.map((s) => s.name);
  const preferred = PREFERRED.filter((n) => names.includes(n));
  const rest = names.filter((n) => !preferred.includes(n) && hasTechIcon(n) && !/concept|core/i.test(skills.find((s) => s.name === n)?.category || ''));
  return [...new Set([...preferred, ...rest])].slice(0, limit);
}

/**
 * Hero portrait in a "studio" style: the photo stands in front of a solid brand-colour arch with a
 * slanted rows of the first name drifting behind it, and an outline frame offset behind the arch.
 * With a background-removed photo (Profile → "Hero cut-out photo") the head overlaps the arch;
 * otherwise the regular profile photo fills it. Clicking a technology badge jumps to the projects
 * filtered by that technology. Hovering the portrait cross-fades the cut-out into a
 * second one (Profile → "Hero hover photo", or the bundled smiling photo). Icon badges show the top technologies.
 * On desktop the portrait tilts towards the cursor and the badges drift at different depths
 * (CSS variables set by the Hero section).
 */
export function HeroPortrait({ profile, skills }) {
  const cutout = profile.heroImage?.url;
  const photo = cutout ? profile.heroImage : profile.avatar;
  const hoverPhoto = profile.heroImageHover?.url || defaultHoverPhoto;
  const badges = topTechnologies(skills, SLOTS.length);
  const initials = profile.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  // First name repeated in rows behind the photo: always readable wherever the head covers it.
  const backdropWord = (profile.name.split(/\s+/)[0] || initials).toUpperCase();

  return (
    <div className="hero-portrait hero-tilt relative mx-auto aspect-[4/5] w-full">
      {/* Outline frame offset behind the arch */}
      <div
        className="parallax absolute inset-x-0 top-[14%] bottom-0 translate-x-[6%] translate-y-[4%] rounded-t-[999px] rounded-b-[2rem] border-2 border-primary/35"
        style={{ '--depth': -14 }}
        aria-hidden="true"
      />

      {/* Arch: solid brand-colour backdrop */}
      <div className="studio-arch absolute inset-x-0 top-[14%] bottom-0 overflow-hidden rounded-t-[999px] rounded-b-[2rem] shadow-2xl shadow-primary/30">
        <div className="studio-pattern" aria-hidden="true">
          {BACKDROP_ROWS.map((row) => (
            <div key={row} className="studio-row" style={{ animationDelay: `${-row * 4}s` }}>
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i}>{backdropWord}</span>
              ))}
            </div>
          ))}
        </div>
        {!cutout && (
          <Img
            src={photo?.url}
            alt={photo?.alt || `Portrait of ${profile.name}`}
            width={800}
            sizes="(min-width: 1024px) 384px, 320px"
            priority
            className="absolute inset-0 size-full object-cover object-top"
            fallback={
              <div className="absolute inset-0 flex items-center justify-center text-6xl font-semibold text-white/80" aria-hidden="true">
                {initials}
              </div>
            }
          />
        )}
      </div>

      {/* Cut-out portrait stands in front of the arch (head overlaps the top edge) */}
      {cutout && (
        <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden rounded-b-[2rem]">
          <Img
            src={photo.url}
            alt={photo.alt || `Portrait of ${profile.name}`}
            width={900}
            sizes="(min-width: 1024px) 460px, 360px"
            priority
            className="portrait-cutout portrait-base absolute bottom-0 left-1/2 w-[118%] max-w-none -translate-x-1/2"
          />
          <Img
            src={hoverPhoto}
            alt=""
            width={900}
            sizes="(min-width: 1024px) 460px, 360px"
            className="portrait-cutout portrait-hover absolute bottom-0 left-1/2 w-[118%] max-w-none -translate-x-1/2"
            fallback={null}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Floating technology badges */}
      {badges.map((name, i) => {
        const { delay, depth, ...pos } = SLOTS[i];
        return (
          <div key={name} className="parallax absolute z-10 hidden sm:block" style={{ ...pos, '--depth': depth }}>
            <button
              type="button"
              onClick={() => showProjectsWith(name)}
              className="tech-badge float-y group/tech flex items-center justify-center rounded-2xl border border-border bg-surface/95 p-2.5 shadow-lg shadow-black/10 backdrop-blur-md transition-transform hover:scale-110 dark:shadow-black/40"
              style={{ animationDelay: delay }}
              aria-label={`Show projects built with ${name}`}
            >
              <TechIcon name={name} className="size-6" colored />
              <span className="tech-badge-label" aria-hidden="true">
                {name} projects →
              </span>
            </button>
          </div>
        );
      })}

      {profile.headline && (
        <div className="parallax absolute -bottom-6 left-1/2 z-10 w-max max-w-[calc(100%+2.5rem)] -translate-x-1/2" style={{ '--depth': 18 }}>
          <div className="float-y flex items-center gap-2.5 rounded-2xl border border-border bg-surface/95 px-4 py-2.5 shadow-xl shadow-black/10 backdrop-blur dark:shadow-black/40" style={{ animationDelay: '0.9s' }}>
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
