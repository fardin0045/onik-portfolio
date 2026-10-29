import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import snapshot from '../data/site-snapshot.json';
import { usePreview } from './usePreview.js';

/** All public content for the home page in a single cached request. */
export function useSiteData() {
  const preview = usePreview();
  return useQuery({
    queryKey: ['site', { preview }],
    queryFn: ({ signal }) => api.get('/public/site', { query: { preview: preview ? '1' : undefined }, signal }),
    // Render the build-time snapshot instantly instead of waiting for the API (which may be cold).
    // `initialDataUpdatedAt: 0` marks it stale, so the live data is still fetched right away.
    initialData: preview || !snapshot ? undefined : snapshot,
    initialDataUpdatedAt: 0,
    staleTime: preview ? 0 : 60_000,
    // A sleeping free-tier API can take ~50 s to wake up: keep retrying (≈ 1 min) before showing an error.
    retry: (count, err) => (err?.status >= 400 && err?.status < 500 && err?.status !== 408 && err?.status !== 429 ? false : count < 6),
    retryDelay: (attempt) => Math.min(1500 * 2 ** attempt, 15_000),
  });
}

/** Builds a project-details payload from the site data the page already has (same shape as the API). */
export function projectFromSite(projects, slug) {
  const i = projects?.findIndex((p) => p.slug === slug) ?? -1;
  if (i < 0) return undefined;
  const link = (p) => (p ? { id: p.id, slug: p.slug, title: p.title } : null);
  return { item: projects[i], prev: link(projects[i - 1]), next: link(projects[i + 1]) };
}

export function useProject(slug, siteProjects) {
  const preview = usePreview();
  return useQuery({
    queryKey: ['project', slug, { preview }],
    queryFn: ({ signal }) => api.get(`/public/projects/${slug}`, { query: { preview: preview ? '1' : undefined }, signal }),
    // Show the project from the already-loaded site data while the API answers.
    placeholderData: () => projectFromSite(siteProjects, slug),
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
