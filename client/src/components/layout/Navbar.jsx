import { Download, Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTheme } from '../../hooks/useTheme.js';
import { cn, resumeHref } from '../../lib/utils.js';
import { isBlogVisible, visibleSections } from '../../sections/registry.js';
import { Button } from '../ui/Button.jsx';
import { Logo } from './Logo.jsx';

function useScrollSpy(ids) {
  const [active, setActive] = useState('');
  useEffect(() => {
    if (!ids.length || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function Navbar({ site }) {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const onHome = pathname === '/';

  const links = useMemo(() => (site ? visibleSections(site).filter((s) => s.showInNav) : []), [site]);
  const ids = useMemo(() => (onHome ? links.map((l) => l.key) : []), [links, onHome]);
  const active = useScrollSpy(ids);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the route changes (derived-state pattern, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const settings = site?.settings;
  const resumeUrl = resumeHref(site?.profile);
  const allowToggle = settings?.theme?.allowToggle !== false;
  const showBlog = isBlogVisible(site);
  const href = (key) => (onHome ? `#${key}` : `/#${key}`);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled || open ? 'border-border bg-bg/80 backdrop-blur-xl' : 'border-transparent bg-transparent',
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 rounded-lg" aria-label={`${site?.profile?.name || 'Home'} — home`}>
          <Logo settings={settings} name={site?.profile?.name} />
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.key}>
              <a
                href={href(l.key)}
                aria-current={active === l.key ? 'true' : undefined}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  'after:absolute after:inset-x-3 after:-bottom-px after:h-px after:origin-center after:bg-primary after:transition-transform after:duration-300',
                  active === l.key ? 'text-fg after:scale-x-100' : 'text-muted after:scale-x-0 hover:text-fg',
                )}
              >
                {l.eyebrow || l.title}
              </a>
            </li>
          ))}
          {showBlog && (
            <li>
              <Link to="/blog" className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-fg">
                Blog
              </Link>
            </li>
          )}
        </ul>

        <div className="flex items-center gap-1.5">
          {allowToggle && (
            <button
              type="button"
              onClick={toggle}
              className="inline-flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
          )}
          {resumeUrl && (
            <Button href={resumeUrl} target="_blank" rel="noopener noreferrer" size="sm" variant="secondary" className="hidden h-9 sm:inline-flex">
              <Download className="size-4" aria-hidden="true" /> Resume
            </Button>
          )}
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl text-fg hover:bg-surface-2 md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-border md:hidden">
          <ul className="container-page flex flex-col py-3">
            {links.map((l) => (
              <li key={l.key}>
                <a
                  href={href(l.key)}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-base font-medium text-muted hover:bg-surface-2 hover:text-fg"
                >
                  {l.eyebrow || l.title}
                </a>
              </li>
            ))}
            {showBlog && (
              <li>
                <Link to="/blog" className="block rounded-lg px-3 py-3 text-base font-medium text-muted hover:bg-surface-2 hover:text-fg">
                  Blog
                </Link>
              </li>
            )}
            {resumeUrl && (
              <li className="px-3 pt-2 pb-1">
                <Button href={resumeUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Download className="size-4" aria-hidden="true" /> Download Resume
                </Button>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
