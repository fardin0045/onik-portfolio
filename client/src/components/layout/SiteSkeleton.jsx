import { useEffect, useState } from 'react';
import { Skeleton } from '../ui/Feedback.jsx';

export function SiteSkeleton() {
  // If loading takes a while (sleeping server on a free hosting plan), say so politely.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="container-page py-16 lg:py-24" aria-busy="true" aria-label="Loading portfolio">
      {slow && (
        <p role="status" className="mb-8 flex items-center justify-center gap-2 text-center text-sm text-muted">
          <span className="pulse-dot size-2 rounded-full bg-primary" aria-hidden="true" />
          Waking up the server — this can take up to a minute on the first visit…
        </p>
      )}
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-14 w-4/5" />
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-12 w-36" />
            <Skeleton className="h-12 w-36" />
          </div>
        </div>
        <Skeleton className="mx-auto aspect-[4/5] w-full max-w-sm rounded-3xl" />
      </div>
      <div className="mt-24 grid gap-6 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
