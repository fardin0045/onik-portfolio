import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, ExternalLink, FileText, ImageIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Feedback.jsx';
import { api, uploadFile } from '../../lib/api.js';
import { cn, formatDate, imageUrl, mediaUrl } from '../../lib/utils.js';
import { useConfirm } from '../components/Dialog.jsx';
import { Dropzone, validateFile } from '../components/MediaPicker.jsx';
import { PageHeader } from '../components/PageHeader.jsx';

const kb = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`);

export default function MediaPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [kind, setKind] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['media', 'library', kind, page],
    queryFn: () => api.get('/admin/media', { query: { kind, page } }),
    placeholderData: (p) => p,
  });

  const upload = async (files) => {
    setBusy(true);
    let ok = 0;
    for (const file of files) {
      const isPdf = file.type === 'application/pdf';
      const err = validateFile(file, isPdf ? 'document' : 'image');
      if (err) {
        toast.error(`${file.name}: ${err}`);
        continue;
      }
      try {
        await uploadFile(file, { folder: isPdf ? 'resume' : 'general', purpose: isPdf ? 'document' : 'image' });
        ok += 1;
      } catch (e) {
        toast.error(`${file.name}: ${e.message}`);
      }
    }
    setBusy(false);
    if (ok) toast.success(`${ok} file${ok > 1 ? 's' : ''} uploaded`);
    qc.invalidateQueries({ queryKey: ['media'] });
  };

  const remove = async (m) => {
    const ok = await confirm({
      title: 'Delete file?',
      message: 'The file is removed from storage permanently. Any project, profile or setting still using it will show a missing image until you choose another one.',
    });
    if (!ok) return;
    try {
      await api.del(`/admin/media/${m.id}`);
      toast.success('File deleted');
      qc.invalidateQueries({ queryKey: ['media'] });
    } catch (e) {
      toast.error(e.message);
    }
  };

  const copy = async (m) => {
    try {
      await navigator.clipboard.writeText(new URL(mediaUrl(m.url), window.location.origin).href);
      toast.success('URL copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <>
      <PageHeader title="Media Library" description="All uploaded images and documents. Images are converted to WebP and resized automatically; metadata (EXIF/GPS) is stripped." />
      <Dropzone
        multiple
        busy={busy}
        onFiles={upload}
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif,application/pdf"
        label="Drop images or PDFs here, or click to upload"
        hint="Images up to 8 MB · PDFs up to 10 MB"
      />

      <div className="mt-8 mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-surface-2 p-1" role="group" aria-label="Filter">
          {[
            ['', 'All'],
            ['image', 'Images'],
            ['document', 'Documents'],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              aria-pressed={kind === v}
              onClick={() => {
                setKind(v);
                setPage(1);
              }}
              className={cn('rounded-lg px-3 py-1.5 text-sm font-medium', kind === v ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')}
            >
              {l}
            </button>
          ))}
        </div>
        {data && <p className="text-sm text-subtle">{data.total} files</p>}
      </div>

      {isPending ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No files yet" description="Uploaded files will appear here." />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((m) => (
              <li key={m.id} className="card overflow-hidden">
                <a href={mediaUrl(m.url)} target="_blank" rel="noopener noreferrer" className="block bg-surface-2" title="Open original">
                  {m.kind === 'image' ? (
                    <img src={imageUrl(m.url, 400)} alt={m.alt || m.originalName} loading="lazy" className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="flex aspect-square flex-col items-center justify-center gap-2 text-muted">
                      <FileText className="size-10" />
                      <span className="text-xs">PDF</span>
                    </div>
                  )}
                </a>
                <div className="p-3">
                  <p className="truncate text-xs font-medium" title={m.originalName}>
                    {m.originalName || 'Untitled'}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] text-subtle">
                    {kb(m.size)} {m.width ? `· ${m.width}×${m.height}` : ''} · {formatDate(m.createdAt, { month: 'short', day: 'numeric' })}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <button type="button" onClick={() => copy(m)} className="rounded-md p-1.5 text-subtle hover:bg-surface-2 hover:text-fg" aria-label="Copy URL">
                      <Copy className="size-3.5" />
                    </button>
                    <a href={mediaUrl(m.url)} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-subtle hover:bg-surface-2 hover:text-fg" aria-label="Open file">
                      <ExternalLink className="size-3.5" />
                    </a>
                    <button type="button" onClick={() => remove(m)} className="ml-auto rounded-md p-1.5 text-subtle hover:bg-danger/10 hover:text-danger" aria-label={`Delete ${m.originalName}`}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
