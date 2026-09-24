import { ArrowLeft, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { useSite } from '../components/layout/PublicLayout.jsx';
import { ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { Img } from '../components/ui/Img.jsx';
import { Markdown } from '../components/ui/Markdown.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { usePost } from '../hooks/useSiteData.js';
import { formatDate, readingTime } from '../lib/utils.js';
import NotFound from './NotFound.jsx';

export default function BlogPost() {
  const { slug } = useParams();
  const site = useSite();
  const { data, isPending, isError, error, refetch } = usePost(slug);
  const post = data?.item;
  const siteUrl = (site.settings.seo.siteUrl || window.location.origin).replace(/\/$/, '');

  useDocumentMeta(
    post
      ? {
          title: `${post.title} — ${site.profile.name}`,
          description: post.excerpt,
          image: post.coverImage?.url,
          type: 'article',
          siteName: site.settings.general.siteTitle,
          url: `${siteUrl}/blog/${post.slug}`,
          noindex: site.preview,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt,
            datePublished: post.publishedAt || post.createdAt,
            dateModified: post.updatedAt,
            author: { '@type': 'Person', name: site.profile.name, url: siteUrl },
          },
        }
      : { title: `Article — ${site.profile.name}` },
  );

  if (isPending) {
    return (
      <div className="container-page max-w-3xl py-14" aria-busy="true">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="mt-6 h-4 w-40" />
        <Skeleton className="mt-10 h-64 w-full" />
      </div>
    );
  }
  if (isError) return error?.status === 404 ? <NotFound /> : <ErrorState error={error} onRetry={refetch} className="min-h-[60vh]" />;

  return (
    <article className="container-page max-w-3xl py-12 sm:py-16">
      <Link to="/blog" className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden="true" /> All articles
      </Link>
      <header className="mt-8">
        <h1 className="text-3xl font-semibold sm:text-4xl">{post.title}</h1>
        <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-subtle">
          <time dateTime={post.publishedAt || post.createdAt}>{formatDate(post.publishedAt || post.createdAt, { year: 'numeric', month: 'long', day: 'numeric' })}</time>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" /> {readingTime(post.content)} min read
          </span>
        </p>
        {post.tags?.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <li key={t}>
                <Link to={`/blog?tag=${encodeURIComponent(t)}`} className="chip hover:text-fg">
                  #{t}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>
      {post.coverImage?.url && (
        <Img src={post.coverImage.url} alt={post.coverImage.alt || ''} width={1400} priority className="mt-10 aspect-[16/9] w-full rounded-2xl border border-border object-cover" />
      )}
      <Markdown className="mt-10 text-base leading-8">{post.content || post.excerpt}</Markdown>
    </article>
  );
}
