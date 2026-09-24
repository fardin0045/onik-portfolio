import { useQuery } from '@tanstack/react-query';
import { LogOut, Monitor, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Feedback.jsx';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/utils.js';
import { useAuth } from '../auth.jsx';
import { useConfirm } from '../components/Dialog.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

const STRONG = (p) => p.length >= 12 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);

function ChangePassword() {
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirm: '' } });

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Password changed. Other devices have been signed out.');
      reset();
    } catch (err) {
      if (err.fields) Object.entries(err.fields).forEach(([k, m]) => setError(k, { message: m }));
      else toast.error(err.message);
    }
  };

  const field = (name, label, rules, autoComplete) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} type="password" autoComplete={autoComplete} className="input" aria-invalid={errors[name] ? 'true' : 'false'} {...register(name, rules)} />
      {errors[name] && (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {errors[name].message}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5 p-6">
      <h2 className="text-base font-semibold">Change password</h2>
      {field('currentPassword', 'Current password', { required: 'Required' }, 'current-password')}
      {field('newPassword', 'New password', { required: 'Required', validate: (v) => STRONG(v) || 'At least 12 characters with upper-case, lower-case letters and a number' }, 'new-password')}
      {field('confirm', 'Confirm new password', { validate: (v) => v === getValues('newPassword') || 'Passwords do not match' }, 'new-password')}
      <Button type="submit" loading={isSubmitting}>
        Update password
      </Button>
    </form>
  );
}

function Sessions() {
  const { logout } = useAuth();
  const confirm = useConfirm();
  const { data, isPending } = useQuery({ queryKey: ['sessions'], queryFn: () => api.get('/auth/sessions') });
  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold">Active sessions</h2>
      <p className="mt-1 text-sm text-muted">Devices currently signed in to the dashboard.</p>
      {isPending ? (
        <Skeleton className="mt-4 h-20" />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {data?.items.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3 text-sm">
              <Monitor className="size-4 shrink-0 text-subtle" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate">{s.userAgent || 'Unknown device'}</p>
                <p className="text-xs text-subtle">Last active {formatDate(s.lastUsedAt, { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
              {s.current && <span className="rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">This device</span>}
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="secondary"
        className="mt-4"
        onClick={async () => {
          if (!(await confirm({ title: 'Sign out everywhere?', message: 'All sessions, including this one, will be signed out.', confirmLabel: 'Sign out all' }))) return;
          await api.post('/auth/logout-all');
          await logout();
        }}
      >
        <LogOut className="size-4" /> Sign out of all devices
      </Button>
    </div>
  );
}

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Security" description={`Signed in as ${user?.email}.`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <ChangePassword />
        <div className="space-y-6">
          <Sessions />
          <div className="card flex gap-4 p-6 text-sm text-muted">
            <ShieldCheck className="size-5 shrink-0 text-success" aria-hidden="true" />
            <p>
              Sessions use httpOnly, SameSite cookies with short-lived access tokens and rotating refresh tokens. Five failed sign-in attempts lock the account for 15 minutes.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
