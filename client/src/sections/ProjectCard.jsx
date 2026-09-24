import { ArrowUpRight, ExternalLink, Star } from 'lucide-react';
import { FaGithub } from 'react-icons/fa6';
import { Link } from 'react-router';
import { Img } from '../components/ui/Img.jsx';
import { TechIcon } from '../components/ui/TechIcon.jsx';

function Placeholder({ title }) {
  return (
    <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-primary-soft to-surface-2" aria-hidden="true">
      <span className="font-mono text-4xl font-semibold text-primary/70">{title.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

export function ProjectCard({ project }) {
  const to = `/projects/${project.slug}`;
  const tech = project.technologies || [];
  return (
    <article className="group card spotlight relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-2xl hover:shadow-black/20">
      <div className="relative overflow-hidden border-b border-border">
        <Img
          src={project.thumbnail?.url}
          alt={project.thumbnail?.alt || `${project.title} preview`}
          width={800}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="aspect-[16/10] w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.05] @xl:aspect-[21/9]"
          fallback={<Placeholder title={project.title} />}
        />
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-bg/90 via-bg/20 to-transparent pb-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true">
          <span className="translate-y-2 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-fg shadow-lg transition-transform duration-300 group-hover:translate-y-0">
            View case study
          </span>
        </div>
        {project.featured && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-bg/85 px-2.5 py-1 text-[0.7rem] font-semibold text-fg backdrop-blur">
            <Star className="size-3 fill-primary text-primary-ink" aria-hidden="true" /> Featured
          </span>
        )}
        {!project.isPublished && (
          <span className="absolute top-3 right-3 rounded-full bg-warning px-2.5 py-1 text-[0.7rem] font-semibold text-black">Hidden</span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 @xl:grid @xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] @xl:content-start @xl:gap-x-10 @xl:p-8">
        {project.category && <p className="font-mono text-xs tracking-wide text-primary-ink @xl:col-start-1">{project.category}</p>}
        <h3 className="mt-2 text-lg font-semibold @xl:col-start-1 @xl:text-2xl">
          {/* Stretched link: the whole card is clickable, inner links stay independently focusable. */}
          <Link to={to} className="rounded-sm after:absolute after:inset-0 after:content-['']">
            {project.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted @xl:col-start-1 @xl:text-base">{project.shortDescription}</p>

        {tech.length > 0 && (
          <ul className="mt-5 flex flex-wrap content-start gap-1.5 @xl:col-start-2 @xl:row-span-3 @xl:row-start-1 @xl:mt-1" aria-label="Technologies">
            {tech.slice(0, 5).map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-md bg-surface-2 px-2 py-1 font-mono text-[0.7rem] text-muted">
                <TechIcon name={t} className="size-3" colored fallback={false} />
                {t}
              </li>
            ))}
            {tech.length > 5 && <li className="rounded-md px-1.5 py-0.5 font-mono text-[0.7rem] text-subtle">+{tech.length - 5}</li>}
          </ul>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-6 @xl:col-span-2 @xl:mt-6 @xl:border-t @xl:border-border @xl:pt-5">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-fg transition-colors group-hover:text-primary-ink">
            View details <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
          </span>
          <div className="relative z-10 flex items-center gap-1">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} source code on GitHub`}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <FaGithub className="size-[18px]" aria-hidden="true" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} live demo`}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                <ExternalLink className="size-[18px]" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
