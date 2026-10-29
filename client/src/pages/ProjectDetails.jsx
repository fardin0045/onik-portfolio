import { ArrowLeft, ArrowRight, BookOpen, Calendar, ExternalLink, Tag } from 'lucide-react';
import { useState } from 'react';
import { FaGithub } from 'react-icons/fa6';
import { Link, useParams } from 'react-router';
import { useSite } from '../components/layout/PublicLayout.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { Img } from '../components/ui/Img.jsx';
import { Markdown } from '../components/ui/Markdown.jsx';
import { TechIcon } from '../components/ui/TechIcon.jsx';
import { useDocumentMeta } from '../hooks/useDocumentMeta.js';
import { projectFromSite, useProject } from '../hooks/useSiteData.js';
import { cn } from '../lib/utils.js';
import NotFound from './NotFound.jsx';

function Gallery({ project }) {
  const images = [project.thumbnail, ...(project.images || [])].filter((img, i, arr) => img?.url && arr.findIndex((x) => x?.url === img.url) === i);
  const [active, setActive] = useState(0);
  if (!images.length) return null;
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div>
      <div className="card overflow-hidden p-1.5">
        <Img src={current.url} alt={current.alt || `${project.title} screenshot`} width={1600} sizes="(min-width: 1024px) 1100px, 100vw" priority className="aspect-[16/10] w-full rounded-xl object-cover object-top" />
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Screenshots">
          {images.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show screenshot ${i + 1}`}
                aria-current={i === active ? 'true' : undefined}
                className={cn('overflow-hidden rounded-lg border-2 transition-colors', i === active ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100')}
              >
                <Img src={img.url} alt="" width={240} className="h-16 w-28 object-cover object-top" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProjectDetails() {
  const { slug } = useParams();
  const site = useSite();
  const { data: live, isPending, isError, error, refetch } = useProject(slug, site.projects);
  // If the API is unreachable, keep showing the copy from the site data instead of an error.
  const data = live ?? (isError && error?.status !== 404 ? projectFromSite(site.projects, slug) : undefined);
  const project = data?.item;

  const siteUrl = (site.settings.seo.siteUrl || window.location.origin).replace(/\/$/, '');
  useDocumentMeta(
    project
      ? {
          title: `${project.title} — ${site.profile.name}`,
          description: project.shortDescription,
          image: project.thumbnail?.url,
          type: 'article',
          siteName: site.settings.general.siteTitle,
          url: `${siteUrl}/projects/${project.slug}`,
          noindex: site.preview || !site.settings.seo.indexable,
          jsonLd: {
            '@context': 'https://schema.org',
            '@type': 'SoftwareSourceCode',
            name: project.title,
            description: project.shortDescription,
            codeRepository: project.githubUrl || undefined,
            programmingLanguage: project.technologies,
            author: { '@type': 'Person', name: site.profile.name, url: siteUrl },
            url: project.liveUrl || undefined,
          },
        }
      : { title: `Project — ${site.profile.name}` },
  );

  if (isPending) {
    return (
      <div className="container-page py-12" aria-busy="true">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-8 h-12 w-2/3" />
        <Skeleton className="mt-4 h-6 w-1/2" />
        <Skeleton className="mt-10 aspect-[16/10] w-full rounded-2xl" />
      </div>
    );
  }
  if (!data) return error?.status === 404 ? <NotFound /> : <ErrorState error={error} onRetry={refetch} className="min-h-[60vh]" />;

  const { prev, next } = data;
  return (
    <article className="container-page py-10 sm:py-14">
      <Link to="/#projects" className="inline-flex items-center gap-2 rounded-md text-sm font-medium text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden="true" /> All projects
      </Link>

      <header className="mt-8 max-w-3xl">
        {project.category && <p className="eyebrow">{project.category}</p>}
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl">{project.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">{project.shortDescription}</p>
        <div className="mt-7 flex flex-wrap gap-3">
          {project.liveUrl && (
            <Button href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" aria-hidden="true" /> Live demo
            </Button>
          )}
          {project.githubUrl && (
            <Button href={project.githubUrl} target="_blank" rel="noopener noreferrer" variant="secondary">
              <FaGithub className="size-4" aria-hidden="true" /> Source code
            </Button>
          )}
          {project.docsUrl && (
            <Button href={project.docsUrl} target="_blank" rel="noopener noreferrer" variant="ghost">
              <BookOpen className="size-4" aria-hidden="true" /> Documentation
            </Button>
          )}
        </div>
      </header>

      <div className="mt-10">
        <Gallery project={project} />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div>
          <h2 className="text-xl font-semibold">About this project</h2>
          <Markdown className="mt-4">{project.description || project.shortDescription}</Markdown>
        </div>
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {project.technologies?.length > 0 && (
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="size-4 text-primary-ink" aria-hidden="true" /> Tech stack
              </h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.technologies.map((t) => (
                  <li key={t} className="chip gap-2 py-1.5 text-fg/90">
                    <TechIcon name={t} className="size-3.5" colored fallback={false} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {project.completedAt && (
            <div className="card flex items-center gap-3 p-5 text-sm">
              <Calendar className="size-4 text-primary-ink" aria-hidden="true" />
              <span className="text-muted">Completed</span>
              <span className="ml-auto font-medium">{project.completedAt}</span>
            </div>
          )}
        </aside>
      </div>

      {(prev || next) && (
        <nav className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2" aria-label="More projects">
          {prev ? (
            <Link to={`/projects/${prev.slug}`} className="card group p-5 hover:border-border-strong">
              <span className="flex items-center gap-1.5 text-xs text-subtle">
                <ArrowLeft className="size-3.5" aria-hidden="true" /> Previous
              </span>
              <span className="mt-1 block font-medium group-hover:text-primary-ink">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link to={`/projects/${next.slug}`} className="card group p-5 text-right hover:border-border-strong">
              <span className="flex items-center justify-end gap-1.5 text-xs text-subtle">
                Next <ArrowRight className="size-3.5" aria-hidden="true" />
              </span>
              <span className="mt-1 block font-medium group-hover:text-primary-ink">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
