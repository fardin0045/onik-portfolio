import { Globe, Link2, Mail, Phone } from 'lucide-react';
import {
  FaBehance,
  FaDev,
  FaDiscord,
  FaDribbble,
  FaFacebook,
  FaGithub,
  FaGitlab,
  FaHashnode,
  FaInstagram,
  FaKaggle,
  FaLinkedin,
  FaMedium,
  FaStackOverflow,
  FaTelegram,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6';
import { SiCodeforces, SiHackerrank, SiLeetcode } from 'react-icons/si';

/** Platform keys the admin can choose in Dashboard → Social Links. */
export const SOCIAL_PLATFORMS = {
  github: { label: 'GitHub', Icon: FaGithub },
  linkedin: { label: 'LinkedIn', Icon: FaLinkedin },
  x: { label: 'X (Twitter)', Icon: FaXTwitter },
  facebook: { label: 'Facebook', Icon: FaFacebook },
  instagram: { label: 'Instagram', Icon: FaInstagram },
  youtube: { label: 'YouTube', Icon: FaYoutube },
  medium: { label: 'Medium', Icon: FaMedium },
  devto: { label: 'DEV', Icon: FaDev },
  hashnode: { label: 'Hashnode', Icon: FaHashnode },
  stackoverflow: { label: 'Stack Overflow', Icon: FaStackOverflow },
  leetcode: { label: 'LeetCode', Icon: SiLeetcode },
  hackerrank: { label: 'HackerRank', Icon: SiHackerrank },
  codeforces: { label: 'Codeforces', Icon: SiCodeforces },
  kaggle: { label: 'Kaggle', Icon: FaKaggle },
  gitlab: { label: 'GitLab', Icon: FaGitlab },
  dribbble: { label: 'Dribbble', Icon: FaDribbble },
  behance: { label: 'Behance', Icon: FaBehance },
  discord: { label: 'Discord', Icon: FaDiscord },
  telegram: { label: 'Telegram', Icon: FaTelegram },
  whatsapp: { label: 'WhatsApp', Icon: FaWhatsapp },
  email: { label: 'Email', Icon: Mail },
  phone: { label: 'Phone', Icon: Phone },
  website: { label: 'Website', Icon: Globe },
  other: { label: 'Other', Icon: Link2 },
};

export function SocialIcon({ platform, className = 'size-[18px]' }) {
  const { Icon } = SOCIAL_PLATFORMS[platform] || SOCIAL_PLATFORMS.other;
  return <Icon className={className} aria-hidden="true" />;
}

export function SocialLinks({ links = [], className = '', itemClassName = '' }) {
  if (!links.length) return null;
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {links.map((l) => {
        const label = l.label || SOCIAL_PLATFORMS[l.platform]?.label || l.platform;
        const external = /^https?:/.test(l.url);
        return (
          <li key={l.id}>
            <a
              href={l.url}
              aria-label={label}
              title={label}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer me' } : {})}
              className={`inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:border-primary hover:text-primary-ink ${itemClassName}`}
            >
              <SocialIcon platform={l.platform} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
