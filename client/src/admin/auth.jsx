import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Spinner } from '../components/ui/Feedback.jsx';
import { api, onUnauthorized } from '../lib/api.js';

const AuthContext = createContext(null);

/**
 * Holds the admin session. The actual credentials live in httpOnly cookies
 * (not readable by JS); this context only knows *whether* we are logged in.
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });
  const qc = useQueryClient();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Access token may have expired while the refresh token is still valid.
        let { user } = await api.get('/auth/me');
        if (!user) ({ user } = await api.post('/auth/refresh'));
        if (alive) setState(user ? { status: 'authenticated', user } : { status: 'anonymous', user: null });
      } catch {
        if (alive) setState({ status: 'anonymous', user: null });
      }
    })();
    const off = onUnauthorized(() => setState({ status: 'anonymous', user: null }));
    return () => {
      alive = false;
      off();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await api.post('/auth/login', { email, password });
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      qc.clear();
      setState({ status: 'anonymous', user: null });
    }
  }, [qc]);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Client-side guard for UX only – every admin API call is authorised on the server. */
export function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="Checking session" />
      </div>
    );
  }
  if (status !== 'authenticated') return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return children;
}
