import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { api } from '../../lib/api.js';
import { cn, imageUrl } from '../../lib/utils.js';
import { Dialog, useConfirm } from './Dialog.jsx';
import { defaultsFor, Field, toPayload } from './fields.jsx';
import { PageHeader } from './PageHeader.jsx';

function applyServerErrors(err, setError) {
  if (err?.fields) Object.entries(err.fields).forEach(([name, message]) => setError(name, { type: 'server', message }));
}

function EditForm({ resourceKey, config, item, onDone, onDirtyChange, allItems }) {
  const qc = useQueryClient();
  const isNew = !item?.id;
  const methods = useForm({ defaultValues: defaultsFor(config.fields, item || {}), mode: 'onBlur' });
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting, isDirty },
  } = methods;

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

  const onSubmit = async (values) => {
    const payload = toPayload(values, config.fields);
    try {
      if (isNew) await api.post(`/admin/${resourceKey}`, payload);
      else await api.patch(`/admin/${resourceKey}/${item.id}`, payload);
      toast.success(`${config.singular} ${isNew ? 'created' : 'saved'}`);
      qc.invalidateQueries({ queryKey: ['admin', resourceKey] });
      qc.invalidateQueries({ queryKey: ['site'] });
      qc.invalidateQueries({ queryKey: ['overview'] });
      onDone();
    } catch (err) {
      applyServerErrors(err, setError);
      toast.error(err.status === 422 ? 'Please fix the highlighted fields' : err.message);
    }
  };

  // Suggestions for text fields (e.g. existing skill categories).
  const suggestions = (f) => (f.suggestionsFrom ? [...new Set(allItems.map((i) => i[f.suggestionsFrom]).filter(Boolean))] : undefined);

  return (
    <FormProvider {...methods}>
      <form id="resource-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2">
        {config.fields.map((f) => (
          <Field key={f.name} field={f} folder={config.folder} suggestions={suggestions(f)} />
        ))}
      </form>
      <div className="sticky -bottom-5 -mx-6 mt-6 flex justify-end gap-2 border-t border-border bg-surface px-6 py-4">
        <Button variant="secondary" onClick={() => onDone(true)}>
          Cancel
        </Button>
        <Button type="submit" form="resource-form" loading={isSubmitting}>
          {isNew ? `Create ${config.singular.toLowerCase()}` : 'Save changes'}
        </Button>
      </div>
    </FormProvider>
  );
}

export function ResourceManager({ resourceKey, config }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | item
  const [dirty, setDirty] = useState(false);

  const queryKey = ['admin', resourceKey];
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey, queryFn: () => api.get(`/admin/${resourceKey}`) });
  const items = useMemo(() => data?.items ?? [], [data]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((i) => (!filter || i.type === filter) && (!term || JSON.stringify([config.list.title(i), config.list.subtitle?.(i)]).toLowerCase().includes(term)));
  }, [items, q, filter, config]);
  const canReorder = !q && !filter;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey });
    qc.invalidateQueries({ queryKey: ['site'] });
    qc.invalidateQueries({ queryKey: ['overview'] });
  };

  const patch = useMutation({
    mutationFn: ({ id, body }) => api.patch(`/admin/${resourceKey}/${id}`, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old) => ({ items: old.items.map((i) => (i.id === id ? { ...i, ...body } : i)) }));
      return { prev };
    },
    onError: (err, _v, ctx) => {
      qc.setQueryData(queryKey, ctx.prev);
      toast.error(err.message);
    },
    onSettled: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (ids) => api.put(`/admin/${resourceKey}/reorder`, { ids }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData(queryKey);
      const byId = Object.fromEntries(prev.items.map((i) => [i.id, i]));
      qc.setQueryData(queryKey, { items: ids.map((id, order) => ({ ...byId[id], order })) });
      return { prev };
    },
    onError: (err, _v, ctx) => {
      qc.setQueryData(queryKey, ctx.prev);
      toast.error(err.message);
    },
    onSettled: invalidate,
  });

  const remove = async (item) => {
    const ok = await confirm({ title: `Delete ${config.singular.toLowerCase()}?`, message: `“${config.list.title(item)}” will be permanently deleted. This cannot be undone.` });
    if (!ok) return;
    try {
      await api.del(`/admin/${resourceKey}/${item.id}`);
      toast.success(`${config.singular} deleted`);
      invalidate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const move = (index, dir) => {
    const ids = items.map((i) => i.id);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    reorder.mutate(ids);
  };

  const closeEditor = async (cancelled) => {
    if (cancelled && dirty && !(await confirm({ title: 'Discard changes?', message: 'You have unsaved changes in this form.', confirmLabel: 'Discard' }))) return;
    setDirty(false);
    setEditing(null);
  };

  const Icon = config.icon;
  return (
    <div>
      <PageHeader
        title={config.label}
        description={config.description}
        actions={
          <Button onClick={() => setEditing({})}>
            <Plus className="size-4" /> Add {config.singular.toLowerCase()}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <input className="input pl-9" placeholder={`Search ${config.label.toLowerCase()}…`} aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {config.filters && (
          <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="group" aria-label="Filter">
            {config.filters.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', filter === f.value ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        <p className="text-sm text-subtle sm:ml-auto">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {isPending ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Icon}
          title={`No ${config.label.toLowerCase()} yet`}
          description={`Add your first ${config.singular.toLowerCase()}. Empty sections are hidden on the public website automatically.`}
          action={
            <Button onClick={() => setEditing({})}>
              <Plus className="size-4" /> Add {config.singular.toLowerCase()}
            </Button>
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different search or filter." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {shown.map((item) => {
            const index = items.findIndex((i) => i.id === item.id);
            const img = config.list.image?.(item);
            return (
              <li key={item.id} className={cn('flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4', !item.isPublished && 'bg-surface-2/50')}>
                {canReorder && (
                  <div className="flex flex-col">
                    <button type="button" disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)} className="rounded p-0.5 text-subtle hover:text-fg disabled:opacity-25" aria-label={`Move ${config.list.title(item)} up`}>
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" disabled={index === items.length - 1 || reorder.isPending} onClick={() => move(index, 1)} className="rounded p-0.5 text-subtle hover:text-fg disabled:opacity-25" aria-label={`Move ${config.list.title(item)} down`}>
                      <ArrowDown className="size-4" />
                    </button>
                  </div>
                )}
                {config.list.image && (
                  <div className="hidden h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 sm:block">
                    {img && <img src={imageUrl(img, 200)} alt="" className="size-full object-cover object-top" loading="lazy" />}
                  </div>
                )}
                <button type="button" onClick={() => setEditing(item)} className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-fg">
                    {config.list.title(item)}
                    {!item.isPublished && <span className="shrink-0 rounded-md bg-warning/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-warning uppercase">Hidden</span>}
                  </p>
                  {config.list.subtitle && <p className="mt-0.5 truncate text-xs text-muted">{config.list.subtitle(item)}</p>}
                </button>
                <div className="flex shrink-0 items-center gap-0.5">
                  {config.list.featured && (
                    <button
                      type="button"
                      onClick={() => patch.mutate({ id: item.id, body: { featured: !item.featured } })}
                      className={cn('rounded-lg p-2 hover:bg-surface-2', item.featured ? 'text-warning' : 'text-subtle hover:text-fg')}
                      aria-label={item.featured ? 'Unfeature' : 'Feature'}
                      aria-pressed={item.featured}
                      title={item.featured ? 'Featured' : 'Mark as featured'}
                    >
                      <Star className={cn('size-4', item.featured && 'fill-current')} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => patch.mutate({ id: item.id, body: { isPublished: !item.isPublished } })}
                    className="rounded-lg p-2 text-subtle hover:bg-surface-2 hover:text-fg"
                    aria-label={item.isPublished ? 'Hide from website' : 'Show on website'}
                    title={item.isPublished ? 'Visible — click to hide' : 'Hidden — click to show'}
                  >
                    {item.isPublished ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </button>
                  <button type="button" onClick={() => setEditing(item)} className="rounded-lg p-2 text-subtle hover:bg-surface-2 hover:text-fg" aria-label={`Edit ${config.list.title(item)}`}>
                    <Pencil className="size-4" />
                  </button>
                  <button type="button" onClick={() => remove(item)} className="rounded-lg p-2 text-subtle hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${config.list.title(item)}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(editing)}
        onClose={() => closeEditor(true)}
        variant="drawer"
        size="lg"
        title={editing?.id ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}
        description={editing?.id ? config.list.title(editing) : undefined}
      >
        {editing && (
          <EditForm
            key={editing.id || 'new'}
            resourceKey={resourceKey}
            config={config}
            item={editing.id ? editing : { type: filter || undefined }}
            allItems={items}
            onDirtyChange={setDirty}
            onDone={(cancelled) => (cancelled ? closeEditor(true) : (setDirty(false), setEditing(null)))}
          />
        )}
      </Dialog>
    </div>
  );
}
