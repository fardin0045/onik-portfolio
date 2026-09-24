import { BellOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn, resumeHref } from '../../lib/utils.js';

/* ───────────── Tuning ───────────── */
const STORE_KEY = 'mascot-state'; // sessionStorage: { fired: [], muted, recent: [] }
const WELCOME_AFTER = 1400; // ms after the page is ready
const PROJECTS_NUDGE_AFTER = 25_000; // only if the visitor hasn't reached Projects yet
const CONTACT_MIN_TIME = 15_000;
const THANKS_MIN_TIME = 20_000;
const EXIT_INTENT_MIN_TIME = 12_000;
const TOUCH_CV_AFTER = 55_000; // phones have no "mouse leaves the page" signal
const STAY_FOR = 9_000; // visible time (paused while hovered/focused)
const TYPING_FOR = 950; // "typing…" indicator before the message appears
const EXIT_MS = 700;
const MIN_GAP = 18_000; // quiet time between two appearances
const POSITIONS = ['left', 'right', 'bottom-left', 'bottom-right'];

const readState = () => {
  try {
    return { fired: [], muted: false, recent: [], ...JSON.parse(sessionStorage.getItem(STORE_KEY) || '{}') };
  } catch {
    return { fired: [], muted: false, recent: [] };
  }
};
const writeState = (s) => {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable – state lives only for this page view */
  }
};
/** A random entrance that differs from the last two used, so it keeps surprising. */
const pickPosition = (recent = []) => {
  const options = POSITIONS.filter((p) => !recent.slice(-2).includes(p));
  return options[Math.floor(Math.random() * options.length)];
};

/** Message catalogue. Texts come from Website Settings → Welcome assistant. */
function buildMessages(s = {}, site = {}) {
  const resume = resumeHref(site.profile, { download: true });
  const contact = site.profile?.contact || {};
  return {
    welcome: {
      title: s.title || 'Hello there! 👋',
      text: s.message || `Welcome to ${site.profile?.name ? `${site.profile.name}'s` : 'my'} portfolio — glad you stopped by.`,
      eyes: 'normal',
    },
    projects: site.projects?.length > 0 && {
      title: 'Curious what I’ve built? 🚀',
      text: s.projectsMessage,
      cta: { label: 'See projects', action: 'projects' },
      eyes: 'happy',
    },
    contact: (contact.formEnabled || contact.email) && {
      title: 'Let’s work together 🤝',
      text: s.contactMessage,
      cta: { label: 'Write a message', action: 'contact' },
      eyes: 'happy',
    },
    cv: resume && {
      title: 'Before you go… 📄',
      text: s.cvMessage,
      cta: { label: 'Download CV', href: resume },
      eyes: 'normal',
    },
    thanks: {
      title: 'Thanks for visiting! 🙌',
      text: s.thanksMessage,
      eyes: 'heart',
    },
  };
}

/* ───────────── The character (original inline SVG) ───────────── */
function Eyes({ variant }) {
  const eye = { fill: 'var(--primary)' };
  if (variant === 'happy') {
    return (
      <g fill="none" style={{ stroke: 'var(--primary)' }} strokeWidth="4" strokeLinecap="round">
        <path d="M58 67 Q65 57 72 67" />
        <path d="M88 67 Q95 57 102 67" />
      </g>
    );
  }
  if (variant === 'heart') {
    const heart = (x) => `M${x} 71 C${x - 13} 61 ${x - 8} 51 ${x} 58 C${x + 8} 51 ${x + 13} 61 ${x} 71 Z`;
    return (
      <g className="mascot-heart-eyes" fill="#ff5c8a">
        <path d={heart(65)} />
        <path d={heart(95)} />
      </g>
    );
  }
  return (
    <g className="mascot-eyes">
      <ellipse cx="65" cy="64" rx="6.5" ry="8.5" style={eye} />
      <ellipse cx="95" cy="64" rx="6.5" ry="8.5" style={eye} />
      <circle cx="67" cy="60.5" r="2.2" fill="#fff" />
      <circle cx="97" cy="60.5" r="2.2" fill="#fff" />
    </g>
  );
}

function Mascot({ waving, eyes, flip }) {
  return (
    <svg viewBox="0 0 160 190" className="h-auto w-full overflow-visible drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)]" aria-hidden="true">
      <defs>
        <linearGradient id="mascot-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--primary)' }} />
          <stop offset="1" style={{ stopColor: 'color-mix(in oklab, var(--primary) 55%, #0b0d12)' }} />
        </linearGradient>
        <radialGradient id="mascot-glow">
          <stop offset="0" style={{ stopColor: 'var(--primary)', stopOpacity: 0.9 }} />
          <stop offset="1" style={{ stopColor: 'var(--primary)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>

      {/* Everything except the chest badge is mirrored when the robot enters from the right. */}
      <g transform={flip ? 'translate(160 0) scale(-1 1)' : undefined}>
        <path d="M36 190 C36 138 52 120 80 120 C108 120 124 138 124 190 Z" fill="url(#mascot-body)" />
        <path d="M58 124 L80 146 L102 124" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="62" y="152" width="36" height="22" rx="7" fill="rgba(11,13,18,.35)" />

        <path d="M44 142 C32 152 32 168 40 176" fill="none" stroke="url(#mascot-body)" strokeWidth="13" strokeLinecap="round" />
        <circle cx="41" cy="177" r="8" fill="#eef1f8" />

        <g className={cn('mascot-arm', waving && 'is-waving')}>
          <path d="M116 140 C130 130 137 114 135 99" fill="none" stroke="url(#mascot-body)" strokeWidth="13" strokeLinecap="round" />
          <circle cx="135" cy="93" r="9.5" fill="#eef1f8" />
        </g>

        <g className="mascot-head">
          <line x1="80" y1="26" x2="80" y2="10" stroke="#cfd5e3" strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="8" r="12" fill="url(#mascot-glow)" className="mascot-antenna-glow" />
          <circle cx="80" cy="8" r="5.5" style={{ fill: 'var(--primary)' }} />
          <rect x="24" y="52" width="12" height="28" rx="6" fill="#cfd5e3" />
          <rect x="124" y="52" width="12" height="28" rx="6" fill="#cfd5e3" />
          <rect x="32" y="24" width="96" height="88" rx="32" fill="#f3f5fb" />
          <rect x="32" y="24" width="96" height="88" rx="32" fill="none" stroke="#dde2ee" strokeWidth="2" />
          <rect x="44" y="42" width="72" height="50" rx="22" fill="#141824" />
          <Eyes variant={eyes} />
          <path d="M72 78 Q80 85 88 78" fill="none" style={{ stroke: 'var(--primary)' }} strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="44" cy="99" rx="7" ry="4" fill="#ff8fab" opacity=".55" />
          <ellipse cx="116" cy="99" rx="7" ry="4" fill="#ff8fab" opacity=".55" />
        </g>
      </g>
      {/* Centred, never mirrored, so it always reads correctly */}
      <text x="80" y="167.5" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" fill="#fff">
        {'</>'}
      </text>
    </svg>
  );
}

/* ───────────── The assistant ───────────── */
/**
 * A friendly assistant that greets visitors and offers a few well-timed, helpful nudges
 * (projects, contact, CV, thanks). Each message appears at most once per visit, never
 * while the visitor is typing, with a quiet gap between appearances, and enters from a
 * different screen position each time. Configured in Website Settings → Welcome assistant.
 */
export function WelcomeMascot({ settings, site }) {
  const enabled = settings?.enabled !== false;
  const [view, setView] = useState(null); // { id, pos, phase }
  const [typing, setTyping] = useState(false);
  const [waving, setWaving] = useState(false);
  const engine = useRef(null);
  const config = useRef({ settings, site });

  useEffect(() => {
    config.current = { settings, site };
  }, [settings, site]);

  useEffect(() => {
    if (!enabled || readState().muted) return undefined;
    const startedAt = Date.now();
    const elapsed = () => Date.now() - startedAt;
    const timers = new Set();
    const later = (fn, ms) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
      return t;
    };

    const queue = [];
    let current = null;
    let nextAllowed = 0;
    let paused = false;
    let exitTimer = null;
    let pumpTimer = null;
    let sawProjects = false;

    const messages = () => buildMessages(config.current.settings, config.current.site);
    const busy = () => document.hidden || Boolean(document.activeElement?.closest?.('form, input, textarea, select'));

    const scheduleExit = (ms) => {
      exitTimer = later(() => (paused ? scheduleExit(1500) : hide()), ms);
    };

    const show = (id) => {
      const state = readState();
      const pos = id === 'welcome' ? 'left' : pickPosition(state.recent);
      writeState({ ...state, fired: [...state.fired, id], recent: [...(state.recent || []), pos].slice(-3) });
      current = id;
      paused = false;
      setView({ id, pos, phase: 'enter' });
      setTyping(true);
      setWaving(true);
      later(() => setTyping(false), TYPING_FOR);
      later(() => setWaving(false), 2600);
      scheduleExit(STAY_FOR);
    };

    const pump = () => {
      if (current || !queue.length) return;
      const wait = nextAllowed - Date.now();
      if (wait > 0 || busy()) {
        if (!pumpTimer) {
          pumpTimer = later(() => {
            pumpTimer = null;
            pump();
          }, Math.max(wait, 3000));
        }
        return;
      }
      show(queue.shift());
    };

    function hide() {
      if (!current) return;
      clearTimeout(exitTimer);
      timers.delete(exitTimer);
      setView((v) => v && { ...v, phase: 'exit' });
      later(() => {
        setView(null);
        current = null;
        nextAllowed = Date.now() + MIN_GAP;
        pump();
      }, EXIT_MS);
    }

    const request = (id) => {
      const state = readState();
      if (state.muted || state.fired.includes(id) || queue.includes(id) || current === id) return;
      if (id !== 'welcome' && config.current.settings?.followUps === false) return;
      if (!messages()[id]) return;
      queue.push(id);
      pump();
    };

    engine.current = {
      hide,
      mute: () => {
        writeState({ ...readState(), muted: true });
        queue.length = 0;
        hide();
      },
      pause: (value) => {
        paused = value;
      },
      wave: () => {
        setWaving(false);
        requestAnimationFrame(() => setWaving(true));
        later(() => setWaving(false), 2600);
      },
    };

    /* ---- Triggers ---- */
    later(() => request('welcome'), WELCOME_AFTER);
    later(() => !sawProjects && request('projects'), PROJECTS_NUDGE_AFTER);

    const inView = (el, ratio = 0.3) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * (1 - ratio) && r.bottom > window.innerHeight * ratio;
    };
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (inView(document.getElementById('projects'))) sawProjects = true;
        if (elapsed() > CONTACT_MIN_TIME && inView(document.getElementById('contact'), 0.35)) request('contact');
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
        if (atBottom && elapsed() > THANKS_MIN_TIME) request('thanks');
      });
    };
    // Exit intent: the pointer leaves through the top of the window (towards tabs / address bar).
    const onMouseOut = (e) => {
      if (!e.relatedTarget && e.clientY <= 0 && elapsed() > EXIT_INTENT_MIN_TIME) request('cv');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('mouseout', onMouseOut);
    if (window.matchMedia('(hover: none)').matches) later(() => request('cv'), TOUCH_CV_AFTER);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(frame);
      engine.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!view || view.phase !== 'enter') return undefined;
    const onKey = (e) => e.key === 'Escape' && engine.current?.hide();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view]);

  if (!view) return null;
  const msg = buildMessages(settings, site)[view.id];
  if (!msg) return null;

  const fromRight = view.pos === 'right' || view.pos === 'bottom-right';
  const fromBottom = view.pos.startsWith('bottom');

  const runAction = () => {
    const { action } = msg.cta;
    if (action === 'projects') document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
    if (action === 'contact') {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => document.getElementById('contact-name')?.focus({ preventScroll: true }), 700);
    }
    engine.current?.hide();
  };

  const ctaClass = 'mt-2.5 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-fg transition hover:brightness-110';

  return (
    <div
      data-pos={view.pos}
      className={cn(
        'mascot-root pointer-events-none fixed z-[65] flex items-end',
        fromRight ? 'flex-row-reverse' : 'flex-row',
        view.pos === 'left' && 'bottom-3 left-0 sm:bottom-6',
        view.pos === 'right' && 'right-0 bottom-20 sm:bottom-24',
        view.pos === 'bottom-left' && 'bottom-0 left-3 sm:left-10',
        view.pos === 'bottom-right' && 'right-3 bottom-0 sm:right-24',
        view.phase === 'exit' ? 'is-exiting' : 'is-entering',
      )}
      onMouseEnter={() => engine.current?.pause(true)}
      onMouseLeave={() => engine.current?.pause(false)}
      onFocus={() => engine.current?.pause(true)}
      onBlur={() => engine.current?.pause(false)}
    >
      <button
        type="button"
        onClick={() => engine.current?.wave()}
        className={cn(
          'mascot-figure pointer-events-auto w-[92px] shrink-0 cursor-pointer rounded-2xl sm:w-[124px]',
          view.pos === 'left' && '-ml-5 sm:-ml-6',
          view.pos === 'right' && '-mr-5 sm:-mr-6',
        )}
        aria-label="Say hi back"
      >
        <Mascot waving={waving} eyes={msg.eyes} flip={fromRight} />
      </button>

      <div
        role="status"
        aria-live="polite"
        className={cn(
          'mascot-bubble pointer-events-auto relative max-w-[calc(100vw-7rem)] sm:max-w-[270px]',
          fromBottom ? 'mb-[76px] sm:mb-[104px]' : 'mb-[68px] sm:mb-[92px]',
          fromRight ? '-mr-1' : '-ml-1',
        )}
      >
        <div
          className={cn(
            'relative w-[236px] rounded-2xl border border-border-strong bg-surface/95 px-4 py-3 shadow-2xl shadow-black/30 backdrop-blur-md sm:w-[270px]',
            fromRight ? 'rounded-br-md' : 'rounded-bl-md',
          )}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              {typing ? (
                <div className="flex h-5 items-center gap-1.5 pt-1" aria-label="typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" style={{ animationDelay: '0.15s' }} />
                  <span className="typing-dot" style={{ animationDelay: '0.3s' }} />
                </div>
              ) : (
                <p className="mascot-message text-sm font-semibold text-fg">{msg.title}</p>
              )}
            </div>
            <div className="-mt-1 -mr-2 flex shrink-0 gap-0.5">
              <button
                type="button"
                onClick={() => engine.current?.mute()}
                className="rounded-md p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label="Don't show more tips"
                title="Don't show more tips"
              >
                <BellOff className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => engine.current?.hide()}
                className="rounded-md p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label="Dismiss"
                title="Dismiss"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
          {!typing && (msg.text || msg.cta) && (
            <div className="mascot-message">
              {msg.text && <p className="mt-1 text-[0.8rem] leading-snug text-muted">{msg.text}</p>}
              {msg.cta &&
                (msg.cta.href ? (
                  <a href={msg.cta.href} target="_blank" rel="noopener noreferrer" onClick={() => engine.current?.hide()} className={ctaClass}>
                    {msg.cta.label}
                  </a>
                ) : (
                  <button type="button" onClick={runAction} className={ctaClass}>
                    {msg.cta.label}
                  </button>
                ))}
            </div>
          )}
          <span
            className={cn(
              'absolute bottom-3 size-3 rotate-45 bg-surface',
              fromRight ? '-right-[7px] border-t border-r border-border-strong' : '-left-[7px] border-b border-l border-border-strong',
            )}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
