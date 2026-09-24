import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { Img } from '../components/ui/Img.jsx';
import { formatDate } from '../lib/utils.js';

export function PostCard({ post }) {
  const external = Boolean(post.externalUrl);
  const linkProps = external
    ? { href: post.externalUrl, target: '_blank', rel: 'noopener noreferrer' }
    : { to: `/blog/${post.slug}` };
  const LinkTag = external ? 'a' : Link;
  return (
    <article className="group card relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-border-strong">
      {post.coverImage?.url && (
        <Img src={post.coverImage.url} alt={post.coverImage.alt || ''} width={720} className="aspect-[16/9] w-full border-b border-border object-cover" />
      )}
      <div className="flex flex-1 flex-col p-6">
        <p className="font-mono text-xs text-subtle">{formatDate(post.publishedAt || post.createdAt)}</p>
        <h3 className="mt-2 text-lg font-semibold">
          <LinkTag {...linkProps} className="rounded-sm after:absolute after:inset-0 after:content-['']">
            {post.title}
          </LinkTag>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5">
          <ul className="flex flex-wrap gap-1.5">
            {post.tags?.slice(0, 3).map((t) => (
              <li key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-[0.7rem] text-muted">
                #{t}
              </li>
            ))}
          </ul>
          <span className="inline-flex items-center gap-1 text-sm font-medium group-hover:text-primary-ink">
            {external ? 'Read on site' : 'Read'} <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  );
}
