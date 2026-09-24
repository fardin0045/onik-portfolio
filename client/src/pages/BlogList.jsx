import { Newspaper } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useSite } from '../components/layout/PublicLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { usePosts } from '../hooks/useSiteData.js';
import { PostCard } from './PostCard.jsx';

export default function BlogList() {
  const site = useSite();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const tag = params.get('tag') || '';
  const { data, isPending, isError, error, refetch } = usePosts(page, tag);
  const section = site.settings.sections.find((s) => s.key === 'blog');

  useDocumentMeta({
    title: `${section?.title || 'Articles'} — ${site.profile.name}`,
    description: section?.subtitle || `Articles and notes by ${site.profile.name}.`,
    siteName: site.settings.general.siteTitle,
  });

  return (
    <div className="container-page py-14 sm:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">{section?.eyebrow || 'Writing'}</p>
        <h1 className="mt-3 text-4xl font-semibold">{section?.title || 'Articles'}</h1>
        {section?.subtitle && <p className="mt-3 text-lg text-muted">{section.subtitle}</p>}
        {tag && (
          <p className="mt-4 text-sm text-muted">
            Tagged <span className="chip">#{tag}</span>{' '}
            <button type="button" className="link-underline ml-2" onClick={() => setParams({})}>
              Clear
            </button>
          </p>
        )}
      </header>

      <div className="mt-12">
        {isPending ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : data.items.length === 0 ? (
          <EmptyState icon={Newspaper} title="No articles yet" description="Check back soon." />
        ) : (
          <>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.items.map((p) => (
                <li key={p.id}>
                  <PostCard post={p} />
                </li>
              ))}
            </ul>
            {data.pages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-3" aria-label="Pagination">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setParams({ page: String(page - 1), ...(tag ? { tag } : {}) })}>
                  Previous
                </Button>
                <span className="text-sm text-muted">
                  Page {page} of {data.pages}
                </span>
                <Button variant="secondary" disabled={page >= data.pages} onClick={() => setParams({ page: String(page + 1), ...(tag ? { tag } : {}) })}>
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
