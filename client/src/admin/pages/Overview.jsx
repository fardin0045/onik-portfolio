import { useQuery } from '@tanstack/react-query';
import { ArrowRight, FileText, Inbox, Plus, User } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button.jsx';
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';
import { useAuth } from '../auth.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { RESOURCES } from '../resources.js';

export default function Overview() {
  const { user } = useAuth();
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: ['overview'], queryFn: () => api.get('/admin/overview') });

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const hasChanges = data.publish.profile.hasChanges || data.publish.settings.hasChanges;
  const empty = Object.entries(data.counts).filter(([k, c]) => c.total === 0 && k !== 'socialLinks');

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ''}`}
        description="Everything on your public portfolio is managed from here."
        actions={
          <>
            <Button to="/admin/projects" variant="secondary">
              <Plus className="size-4" /> Add project
            </Button>
            <Button to="/admin/profile">
              <User className="size-4" /> Edit profile
            </Button>
          </>
        }
      />

      {hasChanges && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-5 py-4 text-sm">
          <span className="font-medium text-warning">You have unpublished profile/settings changes.</span>
          <span className="text-muted">Review them with “Preview”, then click “Publish” in the top bar.</span>
        </div>
      )}

      <section aria-labelledby="content-heading">
        <h2 id="content-heading" className="mb-3 text-sm font-semibold text-muted">
          Content
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.counts).map(([key, c]) => {
            const cfg = RESOURCES[key];
            if (!cfg) return null;
            const Icon = cfg.icon;
            return (
              <li key={key}>
                <Link to={`/admin/${key}`} className="card group flex items-center gap-4 p-4 hover:border-border-strong">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-muted">{cfg.label}</p>
                    <p className="text-xl font-semibold">
                      {c.total}
                      {c.total !== c.published && <span className="ml-1.5 text-xs font-normal text-subtle">({c.total - c.published} hidden)</span>}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
        {empty.length > 0 && (
          <p className="mt-3 text-xs text-subtle">
            Empty sections ({empty.map(([k]) => RESOURCES[k]?.label).join(', ')}) are hidden on the public site until you add content.
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-5" aria-labelledby="messages-heading">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="messages-heading" className="font-semibold">
              Recent messages {data.messages.unread > 0 && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-fg">{data.messages.unread} new</span>}
            </h2>
            <Link to="/admin/contact" className="inline-flex items-center gap-1 text-sm text-primary-ink hover:underline">
              Inbox <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {data.messages.recent.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center text-sm text-muted">
              <Inbox className="mb-2 size-6 text-subtle" /> No messages yet.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.messages.recent.map((m) => (
                <li key={m.id} className="flex items-start gap-3 py-3">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${m.status === 'unread' ? 'bg-primary' : 'bg-transparent'}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.subject}</p>
                    <p className="truncate text-xs text-muted">
                      {m.name} · {m.email}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-subtle">{formatDate(m.createdAt, { month: 'short', day: 'numeric' })}</time>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5" aria-labelledby="quick-heading">
          <h2 id="quick-heading" className="mb-4 font-semibold">
            Quick actions
          </h2>
          <ul className="space-y-2 text-sm">
            {[
              ['/admin/profile', 'Update photo, bio & hero text', User],
              ['/admin/profile', 'Upload a new CV', FileText],
              ['/admin/settings', 'Change colours, SEO & sections', ArrowRight],
              ['/admin/media', `Media library (${data.media} files)`, ArrowRight],
            ].map(([to, label, Icon]) => (
              <li key={label}>
                <Link to={to} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted hover:bg-surface-2 hover:text-fg">
                  <Icon className="size-4" aria-hidden="true" /> {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-4 text-xs text-subtle">
            Last published: {data.publish.profile.publishedAt ? formatDate(data.publish.profile.publishedAt, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          </p>
        </section>
      </div>
    </div>
  );
}
