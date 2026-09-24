/**
 * Thin fetch wrapper for the portfolio API.
 * - Sends cookies (httpOnly JWT) with every request
 * - Adds the CSRF header required by the server for state-changing requests
 * - Transparently refreshes an expired access token once and retries
 */
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

let refreshing = null;
const listeners = new Set();
/** Subscribe to "session expired" events (used by the admin AuthProvider). */
export const onUnauthorized = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

async function refreshSession() {
  refreshing ??= fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then(async (r) => r.ok && Boolean((await r.json().catch(() => null))?.user))
    .catch(() => false)
    .finally(() => {
      setTimeout(() => {
        refreshing = null;
      }, 0);
    });
  return refreshing;
}

export async function request(path, { method = 'GET', body, query, retry = true, signal, auth = false } = {}) {
  const url = new URL(`${API_URL}/api${path}`, window.location.origin);
  if (query) Object.entries(query).forEach(([k, v]) => v !== undefined && v !== '' && url.searchParams.set(k, v));

  const isForm = body instanceof FormData;
  const res = await fetch(url, {
    method,
    credentials: 'include',
    signal,
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 401 && retry && (auth || path.startsWith('/admin') || path.startsWith('/auth/'))) {
    if (!path.startsWith('/auth/login') && !path.startsWith('/auth/refresh') && (await refreshSession())) {
      return request(path, { method, body, query, retry: false, signal, auth });
    }
    if (!path.startsWith('/auth/login')) listeners.forEach((fn) => fn());
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error || `Request failed (${res.status})`, data?.fields);
  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  del: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
};

/** Upload a file to the media library. Returns the created media item. */
export async function uploadFile(file, { folder = 'general', purpose = 'image', alt = '' } = {}) {
  const form = new FormData();
  form.append('folder', folder);
  form.append('purpose', purpose);
  if (alt) form.append('alt', alt);
  form.append('file', file);
  const { item } = await api.post('/admin/media', form);
  return item;
}
