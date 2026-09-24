import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, FileText, ImagePlus, LoaderCircle, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/Button.jsx';
import { EmptyState, Skeleton } from '../../components/ui/Feedback.jsx';
import { api, uploadFile } from '../../lib/api.js';
import { cn, imageUrl } from '../../lib/utils.js';
import { Dialog } from './Dialog.jsx';

export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
export const MAX_IMAGE_MB = 8;
export const MAX_PDF_MB = 10;

/** Client-side pre-check (the server re-validates by file signature). */
export function validateFile(file, kind = 'image') {
  if (kind === 'document') {
    if (file.type !== 'application/pdf') return 'Please choose a PDF file.';
    if (file.size > MAX_PDF_MB * 1024 * 1024) return `PDF must be ${MAX_PDF_MB} MB or smaller.`;
    return null;
  }
  if (!IMAGE_ACCEPT.split(',').includes(file.type) && !(kind === 'icon' && /icon/.test(file.type))) return 'Please choose a JPG, PNG, WebP, AVIF or GIF image.';
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Image must be ${MAX_IMAGE_MB} MB or smaller.`;
  return null;
}

export function Dropzone({ onFiles, accept = IMAGE_ACCEPT, busy, label = 'Drop an image here or click to upload', hint, multiple = false }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files?.length) onFiles([...e.dataTransfer.files]);
      }}
      className={cn('rounded-2xl border-2 border-dashed p-8 text-center transition-colors', over ? 'border-primary bg-primary-soft' : 'border-border-strong')}
    >
      <input ref={input} type="file" accept={accept} multiple={multiple} className="sr-only" tabIndex={-1} onChange={(e) => e.target.files?.length && onFiles([...e.target.files])} />
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
        {busy ? <LoaderCircle className="size-6 animate-spin" /> : <Upload className="size-6" />}
      </div>
      <p className="mt-3 text-sm font-medium">{busy ? 'Uploading & optimising…' : label}</p>
      {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
      <Button variant="secondary" size="sm" className="mt-4" onClick={() => input.current?.click()} disabled={busy}>
        Choose file
      </Button>
    </div>
  );
}

/**
 * Modal to upload a new file or pick one from the media library.
 * onSelect receives a media item { url, alt, ... }.
 */
export function MediaPicker({ open, onClose, onSelect, kind = 'image', folder = 'general', purpose }) {
  const [tab, setTab] = useState('upload');
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const library = useQuery({
    queryKey: ['media', kind],
    queryFn: () => api.get('/admin/media', { query: { kind: kind === 'document' ? 'document' : 'image' } }),
    enabled: open && tab === 'library',
  });

  const handleFiles = async (files) => {
    const file = files[0];
    const err = validateFile(file, purpose === 'icon' ? 'icon' : kind);
    if (err) return toast.error(err);
    setBusy(true);
    try {
      const item = await uploadFile(file, { folder, purpose: purpose || (kind === 'document' ? 'document' : 'image') });
      qc.invalidateQueries({ queryKey: ['media'] });
      toast.success('File uploaded');
      onSelect(item);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <Dialog open={open} onClose={onClose} title={kind === 'document' ? 'Choose a PDF' : 'Choose an image'} size="lg">
      <div className="mb-5 flex gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
        {['upload', 'library'].map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn('flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors', tab === t ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')}
          >
            {t === 'upload' ? 'Upload new' : 'Media library'}
          </button>
        ))}
      </div>

      {tab === 'upload' ? (
        <Dropzone
          onFiles={handleFiles}
          busy={busy}
          accept={kind === 'document' ? 'application/pdf' : purpose === 'icon' ? `${IMAGE_ACCEPT},image/x-icon,.ico` : IMAGE_ACCEPT}
          label={kind === 'document' ? 'Drop a PDF here or click to upload' : undefined}
          hint={kind === 'document' ? `PDF up to ${MAX_PDF_MB} MB` : `JPG, PNG, WebP, AVIF or GIF up to ${MAX_IMAGE_MB} MB — automatically optimised`}
        />
      ) : library.isPending ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : library.data?.items.length ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {library.data.items.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(m);
                  onClose();
                }}
                className="group relative block w-full overflow-hidden rounded-xl border border-border hover:border-primary"
                title={m.originalName}
              >
                {m.kind === 'image' ? (
                  <img src={imageUrl(m.url, 300)} alt={m.alt || m.originalName} loading="lazy" className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square flex-col items-center justify-center gap-2 p-2 text-muted">
                    <FileText className="size-8" />
                    <span className="line-clamp-2 text-xs break-all">{m.originalName}</span>
                  </div>
                )}
                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white group-hover:flex">
                  <Check className="size-6" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ImagePlus} title="No files yet" description="Upload your first file from the Upload tab." />
      )}
    </Dialog>
  );
}
