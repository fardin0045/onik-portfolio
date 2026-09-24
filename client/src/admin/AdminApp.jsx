import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Spinner } from '../components/ui/Feedback.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import NotFound from '../pages/NotFound.jsx';
import { AuthProvider, RequireAuth } from './auth.jsx';
import { ConfirmProvider } from './components/Dialog.jsx';
import { AdminLayout } from './layout/AdminLayout.jsx';
import Login from './pages/Login.jsx';

const Overview = lazy(() => import('./pages/Overview.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const MediaPage = lazy(() => import('./pages/MediaPage.jsx'));
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'));
const ResourcePage = lazy(() => import('./pages/ResourcePage.jsx'));

const Loading = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <Spinner />
  </div>
);

/** The admin dashboard (lazy-loaded bundle, never downloaded by regular visitors). */
export default function AdminApp() {
  useDocumentMeta({ title: 'Admin — Portfolio CMS', description: 'Portfolio administration', noindex: true });
  return (
    <AuthProvider>
      <ConfirmProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={<Loading />}>
                  <Overview />
                </Suspense>
              }
            />
            {[
              ['profile', ProfilePage],
              ['contact', ContactPage],
              ['settings', SettingsPage],
              ['media', MediaPage],
              ['account', AccountPage],
              [':resource', ResourcePage],
            ].map(([path, Page]) => (
              <Route
                key={path}
                path={path}
                element={
                  <Suspense fallback={<Loading />}>
                    <Page />
                  </Suspense>
                }
              />
            ))}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </ConfirmProvider>
    </AuthProvider>
  );
}
