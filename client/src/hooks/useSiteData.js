import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { usePreview } from './usePreview.js';

/** All public content for the home page in a single cached request. */
export function useSiteData() {
  const preview = usePreview();
  return useQuery({
    queryKey: ['site', { preview }],
    queryFn: ({ signal }) => api.get('/public/site', { query: { preview: preview ? '1' : undefined }, signal }),
    staleTime: preview ? 0 : 60_000,
    // A sleeping free-tier API can take ~50 s to wake up: keep retrying (≈ 1 min) before showing an error.
    retry: (count, err) => (err?.status >= 400 && err?.status < 500 && err?.status !== 408 && err?.status !== 429 ? false : count < 6),
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 15_000),
  });
}

export function useProject(slug) {
  const preview = usePreview();
  return useQuery({
    queryKey: ['project', slug, { preview }],
    queryFn: ({ signal }) => api.get(`/public/projects/${slug}`, { query: { preview: preview ? '1' : undefined }, signal }),
    enabled: Boolean(slug),
    retry: (count, err) => err?.status !== 404 && count < 2,
  });
}

export function usePosts(page = 1, tag = '') {
  const preview = usePreview();
  return useQuery({
    queryKey: ['posts', page, tag, { preview }],
    queryFn: ({ signal }) => api.get('/public/posts', { query: { page, tag, preview: preview ? '1' : undefined }, signal }),
    placeholderData: (prev) => prev,
  });
}

export function usePost(slug) {
  const preview = usePreview();
  return useQuery({
    queryKey: ['post', slug, { preview }],
    queryFn: ({ signal }) => api.get(`/public/posts/${slug}`, { query: { preview: preview ? '1' : undefined }, signal }),
    enabled: Boolean(slug),
    retry: (count, err) => err?.status !== 404 && count < 2,
  });
}
