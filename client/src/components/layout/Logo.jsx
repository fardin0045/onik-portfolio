import { mediaUrl } from '../../lib/utils.js';

/** Logo image (Website Settings → General) or a typographic wordmark fallback. */
export function Logo({ settings, name }) {
  if (!settings) return <span className="skeleton block h-6 w-20" aria-hidden="true" />;
  const logo = settings.general?.logo;
  if (logo?.url) {
    return <img src={mediaUrl(logo.url)} alt={logo.alt || name || 'Logo'} className="h-8 w-auto" width="120" height="32" />;
  }
  const text = settings?.general?.logoText || name || 'Portfolio';
  return (
    <span className="font-mono text-lg font-semibold tracking-tight text-fg">
      {text}
      <span className="text-primary-ink">.</span>
    </span>
  );
}
