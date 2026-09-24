import { useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { exitPreview } from '../../hooks/usePreview.js';

export function PreviewBanner() {
  const qc = useQueryClient();
  return (
    <div role="status" className="relative z-[60] bg-warning text-sm font-medium text-black">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-center">
        <span className="inline-flex items-center gap-2">
          <Eye className="size-4" aria-hidden="true" /> Preview mode — you are seeing unpublished drafts and hidden items.
        </span>
        <button
          type="button"
          className="rounded-md underline underline-offset-4"
          onClick={() => {
            exitPreview();
            qc.invalidateQueries();
          }}
        >
          Exit preview
        </button>
      </div>
    </div>
  );
}
