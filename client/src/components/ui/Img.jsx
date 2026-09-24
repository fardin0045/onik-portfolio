import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn, imageSrcSet, imageUrl } from '../../lib/utils.js';

/**
 * Optimised image: lazy-loaded by default, responsive srcset for Cloudinary,
 * reserved aspect ratio (no layout shift) and a graceful fallback.
 */
export function Img({ src, alt = '', width = 1200, sizes = '100vw', className, priority = false, fallback, ...props }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      fallback ?? (
        <div className={cn('flex items-center justify-center bg-surface-2 text-subtle', className)} role="img" aria-label={alt || 'Image unavailable'}>
          <ImageOff className="size-6" aria-hidden="true" />
        </div>
      )
    );
  }
  return (
    <img
      src={imageUrl(src, width)}
      srcSet={imageSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      onError={() => setFailed(true)}
      className={className}
      {...props}
    />
  );
}
