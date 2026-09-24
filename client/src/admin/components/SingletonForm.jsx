import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.jsx';
import { ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { api } from '../../lib/api.js';
import { defaultsFor, Field, toPayload } from './fields.jsx';

export function useSingleton(key) {
  return useQuery({ queryKey: ['singleton', key], queryFn: () => api.get(`/admin/singletons/${key}`).then((r) => r.item) });
}

/**
 * Edits part of a singleton draft (profile / settings).
 * `groups` = [{ title, description, fields: [...] }]. Saving stores a DRAFT –
 * visitors only see it after "Publish".
 */
export function SingletonForm({ singleton, groups, submitLabel = 'Save draft', children, transform }) {
  const qc = useQueryClient();
  const { data, isPending, isError, error, refetch } = useSingleton(singleton);
  const fields = groups.flatMap((g) => g.fields);
  const methods = useForm({ mode: 'onBlur' });
  const {
    reset,
    handleSubmit,
    setError,
    formState: { isSubmitting, isDirty },
  } = methods;

  useEffect(() => {
    if (data) reset(defaultsFor(fields, data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, reset]);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!isDirty) return undefined;
    const h = (e) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [isDirty]);

  const onSubmit = async (values) => {
    let payload = toPayload(values, fields);
    if (transform) payload = transform(payload, values);
    try {
      const { item } = await api.patch(`/admin/singletons/${singleton}`, payload);
      qc.setQueryData(['singleton', singleton], item);
      qc.invalidateQueries({ queryKey: ['publish-status'] });
      qc.invalidateQueries({ queryKey: ['site', { preview: true }] });
      toast.success('Draft saved — click “Publish” to make it live');
    } catch (err) {
      if (err.fields) Object.entries(err.fields).forEach(([k, m]) => setError(k, { type: 'server', message: m }));
      toast.error(err.status === 422 ? 'Please fix the highlighted fields' : err.message);
    }
  };

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {groups.map((g) => (
          <fieldset key={g.title} className="card p-5 sm:p-6">
            <legend className="sr-only">{g.title}</legend>
            <div className="mb-5">
              <h2 className="text-base font-semibold">{g.title}</h2>
              {g.description && <p className="mt-0.5 text-sm text-muted">{g.description}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {g.fields.map((f) => (
                <Field key={f.name} field={f} folder={g.folder} />
              ))}
            </div>
          </fieldset>
        ))}
        {children}
        <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-3 border-t border-border bg-bg/90 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
          {isDirty && <span className="mr-auto text-sm text-warning">Unsaved changes</span>}
          <Button variant="secondary" disabled={!isDirty || isSubmitting} onClick={() => reset()}>
            Reset
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
