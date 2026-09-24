import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, ArchiveRestore, Inbox, Mail, MailOpen, Reply, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { api } from '../../lib/api.js';
import { cn, formatDate } from '../../lib/utils.js';
import { useConfirm } from '../components/Dialog.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { SingletonForm } from '../components/SingletonForm.jsx';

const CONTACT_GROUPS = [
  {
    title: 'Contact information',
    description: 'Shown in the Contact section. Hidden details are never sent to visitors’ browsers.',
    fields: [
      { name: 'contact.email', label: 'Email', type: 'email', maxLength: 254 },
      { name: 'contact.phone', label: 'Phone', type: 'text', maxLength: 40 },
      { name: 'contact.location', label: 'Location', type: 'text', maxLength: 120, span: 2 },
      { name: 'contact.note', label: 'Intro text (optional)', type: 'textarea', maxLength: 300, rows: 2, span: 2 },
      { name: 'contact.showEmail', label: 'Show email publicly', type: 'switch' },
      { name: 'contact.showPhone', label: 'Show phone publicly', type: 'switch' },
      { name: 'contact.formEnabled', label: 'Enable contact form', type: 'switch' },
    ],
  },
];

const TABS = [
  { value: '', label: 'Inbox' },
  { value: 'unread', label: 'Unread' },
  { value: 'archived', label: 'Archived' },
];

function Messages() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(1);
  const key = ['messages', status, page];
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: key, queryFn: () => api.get('/admin/messages', { query: { status, page } }), placeholderData: (p) => p });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['messages'] });
    qc.invalidateQueries({ queryKey: ['overview'] });
  };
  const setMsgStatus = useMutation({
    mutationFn: ({ id, s }) => api.patch(`/admin/messages/${id}`, { status: s }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });

  const open = (m) => {
    setOpenId(openId === m.id ? null : m.id);
    if (m.status === 'unread') setMsgStatus.mutate({ id: m.id, s: 'read' });
  };

  const remove = async (m) => {
    if (!(await confirm({ title: 'Delete message?', message: `The message from ${m.name} will be permanently deleted.` }))) return;
    try {
      await api.del(`/admin/messages/${m.id}`);
      toast.success('Message deleted');
      refresh();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <section aria-labelledby="inbox-heading" className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="inbox-heading" className="text-lg font-semibold">
          Messages {data?.unread > 0 && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-fg">{data.unread} unread</span>}
        </h2>
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="group" aria-label="Filter messages">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={status === t.value}
              onClick={() => {
                setStatus(t.value);
                setPage(1);
              }}
              className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', status === t.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Inbox} title="No messages" description="Messages sent through the contact form will appear here." />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {data.items.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => open(m)} aria-expanded={openId === m.id} className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-surface-2">
                  <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', m.status === 'unread' ? 'bg-primary' : 'bg-transparent')} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-sm', m.status === 'unread' ? 'font-semibold text-fg' : 'font-medium text-muted')}>{m.subject}</p>
                    <p className="truncate text-xs text-subtle">
                      {m.name} · {m.email}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-subtle" dateTime={m.createdAt}>
                    {formatDate(m.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </button>
                {openId === m.id && (
                  <div className="border-t border-border bg-bg/50 px-4 py-4 sm:px-9">
                    {/* Rendered as plain text – visitor input is never interpreted as HTML. */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-fg">{m.message}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-fg"
                      >
                        <Reply className="size-3.5" /> Reply by email
                      </a>
                      <button type="button" onClick={() => setMsgStatus.mutate({ id: m.id, s: m.status === 'unread' ? 'read' : 'unread' })} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-surface-2">
                        {m.status === 'unread' ? <MailOpen className="size-3.5" /> : <Mail className="size-3.5" />} Mark {m.status === 'unread' ? 'read' : 'unread'}
                      </button>
                      <button type="button" onClick={() => setMsgStatus.mutate({ id: m.id, s: m.status === 'archived' ? 'read' : 'archived' })} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-surface-2">
                        {m.status === 'archived' ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />} {m.status === 'archived' ? 'Unarchive' : 'Archive'}
                      </button>
                      <button type="button" onClick={() => remove(m)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-danger hover:bg-danger/10">
                        <Trash2 className="size-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-3 text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">
                Previous
              </button>
              <span className="text-muted">
                {page} / {data.pages}
              </span>
              <button type="button" disabled={page >= data.pages} onClick={() => setPage(page + 1)} className="rounded-lg border border-border px-3 py-1.5 disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contact & Messages" description="Edit your public contact details and read messages from the contact form." />
      <SingletonForm singleton="profile" groups={CONTACT_GROUPS} />
      <Messages />
    </>
  );
}
