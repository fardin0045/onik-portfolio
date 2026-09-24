import { TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import { cn } from '../../lib/utils.js';

/**
 * Accessible modal built on the native <dialog> element
 * (focus trap, Esc to close and inert background for free).
 * variant="drawer" slides in from the right (used for edit forms).
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', variant = 'modal' }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose?.();
      }}
      onClick={(e) => e.target === ref.current && onClose?.()}
      aria-labelledby="dialog-title"
      className={cn(
        'bg-transparent p-0 text-fg backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        variant === 'drawer'
          ? 'fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full'
          : 'm-auto w-[calc(100%-2rem)]',
        widths[size],
      )}
    >
      {open && (
        <div className={cn('flex flex-col border border-border bg-surface shadow-2xl', variant === 'drawer' ? 'h-full' : 'max-h-[85dvh] rounded-2xl')}>
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
            <div>
              <h2 id="dialog-title" className="text-lg font-semibold">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

const ConfirmContext = createContext(null);

/** Promise-based confirmation dialog: `if (await confirm({...})) doIt()` */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setState({ ...opts, resolve });
      }),
    [],
  );
  const close = (value) => {
    state?.resolve(value);
    setState(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={Boolean(state)}
        onClose={() => close(false)}
        title={state?.title || 'Are you sure?'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant={state?.danger === false ? 'primary' : 'danger'} onClick={() => close(true)} autoFocus>
              {state?.confirmLabel || 'Delete'}
            </Button>
          </>
        }
      >
        <div className="flex gap-4">
          {state?.danger !== false && (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger">
              <TriangleAlert className="size-5" aria-hidden="true" />
            </span>
          )}
          <p className="text-sm text-muted">{state?.message || 'This action cannot be undone.'}</p>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
