import { hasTechIcon, TechIcon } from './TechIcon.jsx';

/** Ring definitions: size (fraction of the orbit), how many logos, spin duration and direction. */
const RINGS = [
  { size: 0.44, count: 4, duration: 26, reverse: false },
  { size: 0.68, count: 6, duration: 38, reverse: true },
  { size: 0.92, count: 8, duration: 52, reverse: false },
];

/**
 * Animated "solar system" of technology logos. Rings rotate in alternating directions
 * while each logo counter-rotates so it always stays upright. Sizes use container-query
 * units, so the orbit scales fluidly with its box. Pauses on hover; static with reduced motion.
 */
export function TechOrbit({ skills = [], label = 'Toolkit' }) {
  const names = [
    ...new Set(skills.filter((s) => hasTechIcon(s.name) && !/concept|core/i.test(s.category)).map((s) => s.name)),
  ];
  if (names.length < 6) return null;

  const rings = RINGS.map((ring, idx) => {
    const start = RINGS.slice(0, idx).reduce((sum, r) => sum + r.count, 0);
    return { ...ring, items: names.slice(start, start + ring.count) };
  }).filter((r) => r.items.length);

  return (
    <div className="orbit @container relative mx-auto aspect-square w-full max-w-[380px]" role="img" aria-label={`${label}: ${names.join(', ')}`}>
      {/* glow */}
      <div
        className="absolute inset-[12%] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--primary), transparent)' }}
        aria-hidden="true"
      />

      {rings.map((ring, r) => (
        <div
          key={ring.size}
          className="orbit-ring absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-fg/15"
          style={{
            width: `${ring.size * 100}%`,
            height: `${ring.size * 100}%`,
            '--orbit-duration': `${ring.duration}s`,
            '--orbit-direction': ring.reverse ? 'reverse' : 'normal',
            '--orbit-counter-direction': ring.reverse ? 'normal' : 'reverse',
          }}
          aria-hidden="true"
        >
          {/* a small "comet" riding each ring */}
          <span className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
          {ring.items.map((name, i) => {
            const angle = (360 / ring.items.length) * i + r * 22;
            return (
              <div
                key={name}
                className="absolute top-1/2 left-1/2"
                style={{ transform: `rotate(${angle}deg) translateX(calc(${ring.size} * 50cqw)) rotate(${-angle}deg)` }}
              >
                <div className="orbit-counter -translate-x-1/2 -translate-y-1/2">
                  <span
                    className="group flex size-10 items-center justify-center rounded-full border border-border-strong bg-surface shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-125 sm:size-11"
                    title={name}
                  >
                    <TechIcon name={name} className="size-5" colored />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* core */}
      <div className="absolute top-1/2 left-1/2 flex size-[26%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-primary/40 bg-surface text-center shadow-[0_0_60px_-10px_var(--primary)]" aria-hidden="true">
        <span className="pulse-dot absolute inset-0 rounded-full bg-primary/10" />
        <span className="relative font-mono text-lg font-bold text-primary-ink sm:text-xl">{'</>'}</span>
        <span className="relative mt-0.5 font-mono text-[0.6rem] tracking-widest text-subtle uppercase">{names.length} tools</span>
      </div>
    </div>
  );
}
