import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CircleCheck,
  ExternalLink,
  Eye,
  FolderOpen,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RotateCcw,
  Settings,
  Sun,
  UploadCloud,
  User,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { api } from '../../lib/api.js';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../auth.jsx';
import { useConfirm } from '../components/Dialog.jsx';
import { RESOURCES } from '../resources.js';

const NAV = [
  { label: 'Dashboard', items: [{ to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true }] },
  {
    label: 'Content',
    items: [
      { to: '/admin/profile', label: 'Profile', icon: User },
      ...['projects', 'skills', 'experience', 'education', 'research', 'certifications', 'achievements', 'services', 'testimonials', 'posts'].map((k) => ({
        to: `/admin/${k}`,
        label: RESOURCES[k].label,
        icon: RESOURCES[k].icon,
      })),
    ],
  },
  {
    label: 'Website',
    items: [
      { to: '/admin/socialLinks', label: RESOURCES.socialLinks.label, icon: RESOURCES.socialLinks.icon },
      { to: '/admin/contact', label: 'Contact & Messages', icon: Inbox, badge: 'unread' },
      { to: '/admin/settings', label: 'Website Settings', icon: Settings },
      { to: '/admin/media', label: 'Media Library', icon: FolderOpen },
    ],
  },
  { label: 'Account', items: [{ to: '/admin/account', label: 'Security', icon: KeyRound }] },
];

/** Draft/publish controls for profile + settings. */
function PublishBar() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data } = useQuery({ queryKey: ['publish-status'], queryFn: () => api.get('/admin/publish'), refetchOnWindowFocus: true });
  const hasChanges = Boolean(data?.profile?.hasChanges || data?.settings?.hasChanges);

  const after = (status) => {
    qc.setQueryData(['publish-status'], status);
    qc.invalidateQueries({ queryKey: ['site'] });
    qc.invalidateQueries({ queryKey: ['singleton'] });
    qc.invalidateQueries({ queryKey: ['overview'] });
  };
  const publish = useMutation({
    mutationFn: () => api.post('/admin/publish'),
    onSuccess: (s) => {
      after(s);
      toast.success('Changes published — your website is up to date');
    },
    onError: (e) => toast.error(e.message),
  });
  const discard = useMutation({
    mutationFn: () => api.post('/admin/publish/discard'),
    onSuccess: (s) => {
      after(s);
      toast.success('Draft changes discarded');
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex items-center gap-2">
      <span className={cn('hidden items-center gap-1.5 text-xs font-medium lg:inline-flex', hasChanges ? 'text-warning' : 'text-success')} role="status">
        {hasChanges ? <span className="size-2 rounded-full bg-warning" aria-hidden="true" /> : <CircleCheck className="size-3.5" aria-hidden="true" />}
        {hasChanges ? 'Unpublished changes' : 'All changes live'}
      </span>
      <Button href="/?preview=1" target="_blank" rel="noopener" variant="secondary" size="sm" title="Preview drafts and hidden items in a new tab">
        <Eye className="size-4" /> <span className="hidden sm:inline">Preview</span>
      </Button>
      {hasChanges && (
        <Button
          variant="ghost"
          size="sm"
          title="Discard draft changes"
          aria-label="Discard draft changes"
          onClick={async () => (await confirm({ title: 'Discard draft changes?', message: 'Profile and website-settings drafts will be reset to the currently published version.', confirmLabel: 'Discard' })) && discard.mutate()}
        >
          <RotateCcw className="size-4" />
        </Button>
      )}
      <Button size="sm" disabled={!hasChanges} loading={publish.isPending} onClick={() => publish.mutate()}>
        <UploadCloud className="size-4" /> Publish
      </Button>
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: overview } = useQuery({ queryKey: ['overview'], queryFn: () => api.get('/admin/overview'), staleTime: 30_000 });

  // Close the mobile menu whenever the route changes (derived-state pattern, no effect needed).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const sidebar = (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <span className="font-mono text-base font-semibold">
          admin<span className="text-primary-ink">.</span>
        </span>
        <button type="button" className="rounded-lg p-1.5 text-muted lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[0.68rem] font-semibold tracking-wider text-subtle uppercase">{group.label}</p>
            <ul className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon, end, badge }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isActive ? 'bg-primary-soft text-primary-ink' : 'text-muted hover:bg-surface-2 hover:text-fg')
                    }
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                    {badge === 'unread' && overview?.messages?.unread > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary-fg">
                        {overview.messages.unread}
                        <span className="sr-only"> unread</span>
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-3">
        <p className="truncate px-3 pb-2 text-xs text-subtle" title={user?.email}>
          {user?.email}
        </p>
        <div className="flex gap-1">
          <a href="/" target="_blank" rel="noopener" className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
            <ExternalLink className="size-4" /> View site
          </a>
          <button type="button" onClick={toggle} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <button type="button" onClick={logout} className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger" aria-label="Log out" title="Log out">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-dvh border-r border-border bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-border bg-surface">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur sm:px-8">
          <button type="button" className="rounded-lg p-2 text-fg hover:bg-surface-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            <Menu className="size-5" />
          </button>
          <div className="ml-auto">
            <PublishBar />
          </div>
        </header>
        <main id="admin-main" className="px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
