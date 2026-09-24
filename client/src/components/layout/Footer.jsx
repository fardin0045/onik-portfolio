import { ArrowUp } from 'lucide-react';
import { Link } from 'react-router';
import { SocialLinks } from '../ui/SocialIcon.jsx';
import { Logo } from './Logo.jsx';

export function Footer({ site }) {
  const { settings, profile, socialLinks = [] } = site;
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="container-page flex flex-col items-center gap-6 py-10 text-center md:flex-row md:justify-between md:py-12 md:text-left">
        <div className="max-w-md">
          <Link to="/" className="inline-block rounded-lg" aria-label="Back to home">
            <Logo settings={settings} name={profile.name} />
          </Link>
          {settings.footer.text && <p className="mt-3 text-sm text-muted">{settings.footer.text}</p>}
        </div>
        {settings.footer.showSocials && <SocialLinks links={socialLinks} />}
      </div>
      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-subtle sm:flex-row">
          <p>
            © {year} {profile.name}. All rights reserved.
          </p>
          <a href="#main" className="inline-flex items-center gap-1.5 rounded-md hover:text-fg">
            Back to top <ArrowUp className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
