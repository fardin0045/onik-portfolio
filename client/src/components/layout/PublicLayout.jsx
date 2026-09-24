import { useEffect } from 'react';
import { Outlet, useOutletContext } from 'react-router';
import { applyDefaultTheme } from '../../hooks/useTheme.js';
import { useSiteData } from '../../hooks/useSiteData.js';
import { mediaUrl, readableOn } from '../../lib/utils.js';
import { ErrorState } from '../ui/Feedback.jsx';
import { Footer } from './Footer.jsx';
import { Navbar } from './Navbar.jsx';
import { PreviewBanner } from './PreviewBanner.jsx';
import { ScrollToTop } from './ScrollToTop.jsx';
import { SiteSkeleton } from './SiteSkeleton.jsx';
import { WelcomeMascot } from './WelcomeMascot.jsx';

/** Applies admin-controlled branding (colour, favicon, default theme) to the document. */
function useBranding(settings) {
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    const color = settings.theme?.primaryColor || '#5b8cff';
    root.style.setProperty('--primary', color);
    root.style.setProperty('--primary-fg', readableOn(color));
    applyDefaultTheme(settings.theme?.defaultTheme);

    const favicon = settings.general?.favicon;
    if (favicon) {
      document.querySelectorAll('link[rel="icon"]').forEach((l) => l.remove());
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = mediaUrl(favicon);
      document.head.appendChild(link);
    }
    let theme = document.querySelector('meta[name="theme-color"]');
    if (!theme) {
      theme = document.createElement('meta');
      theme.name = 'theme-color';
      document.head.appendChild(theme);
    }
    theme.content = color;
  }, [settings]);
}

/** One delegated, rAF-throttled pointer listener powers the `.spotlight` hover glow on every card. */
function useSpotlight() {
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return undefined;
    let frame = 0;
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = e.target instanceof Element ? e.target.closest('.spotlight') : null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
}

export function PublicLayout() {
  const { data, isPending, isError, error, refetch } = useSiteData();
  useBranding(data?.settings);
  useSpotlight();

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="scroll-progress" aria-hidden="true" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
      >
        Skip to content
      </a>
      {data?.preview && <PreviewBanner />}
      <Navbar site={data} />
      <main id="main" className="flex-1" tabIndex={-1}>
        {isPending ? <SiteSkeleton /> : isError ? <ErrorState error={error} onRetry={refetch} className="min-h-[60vh]" /> : <Outlet context={data} />}
      </main>
      {data && <Footer site={data} />}
      <ScrollToTop />
      {data && <WelcomeMascot settings={data.settings.welcome} site={data} />}
    </div>
  );
}

/** Access the public site payload from any page rendered inside PublicLayout. */
export const useSite = () => useOutletContext();
