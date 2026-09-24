import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';

export default function NotFound() {
  useDocumentMeta({ title: 'Page not found', description: 'The page you are looking for does not exist.', noindex: true });
  return (
    <section className="container-page flex min-h-[65vh] flex-col items-center justify-center py-20 text-center" aria-labelledby="nf-title">
      <p className="font-mono text-sm font-medium tracking-widest text-primary-ink">ERROR 404</p>
      <h1 id="nf-title" className="mt-4 text-4xl font-semibold sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-muted">The page you’re looking for doesn’t exist or may have been moved.</p>
      <Button to="/" className="mt-8" size="lg">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
      </Button>
    </section>
  );
}
