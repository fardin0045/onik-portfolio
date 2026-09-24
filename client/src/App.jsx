import { lazy, Suspense } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, ScrollRestoration, useRouteError } from 'react-router';
import { Toaster } from 'sonner';
import { PublicLayout } from './components/layout/PublicLayout.jsx';
import { ErrorState, Spinner } from './components/ui/Feedback.jsx';
import { useTheme } from './hooks/useTheme.js';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';

// Code splitting: secondary pages and the whole admin dashboard load on demand.
const ProjectDetails = lazy(() => import('./pages/ProjectDetails.jsx'));
const BlogList = lazy(() => import('./pages/BlogList.jsx'));
const BlogPost = lazy(() => import('./pages/BlogPost.jsx'));
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

function Root() {
  const { theme } = useTheme();
  return (
    <>
      <ScrollRestoration />
      <Suspense fallback={<PageFallback />}>
        <Outlet />
      </Suspense>
      <Toaster theme={theme} position="bottom-right" richColors closeButton />
    </>
  );
}

/** Last-resort error boundary: never show a blank page or a stack trace to visitors. */
function RouteError() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error(error);
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <ErrorState error={{ message: 'An unexpected error occurred. Please reload the page.' }} onRetry={() => window.location.reload()} />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'projects/:slug', element: <ProjectDetails /> },
          { path: 'blog', element: <BlogList /> },
          { path: 'blog/:slug', element: <BlogPost /> },
          { path: '*', element: <NotFound /> },
        ],
      },
      { path: 'admin/*', element: <AdminApp /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
