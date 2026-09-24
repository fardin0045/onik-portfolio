import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { PostCard } from '../pages/PostCard.jsx';
import { SectionShell } from './SectionShell.jsx';

export default function Blog({ site, section }) {
  const posts = site.posts.slice(0, 3);
  return (
    <SectionShell
      section={section}
      alt
      action={
        site.counts?.posts > 3 && (
          <Button to="/blog" variant="secondary">
            All articles <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        )
      }
    >
      <ul className="grid gap-6 md:grid-cols-3">
        {posts.map((p, i) => (
          <Reveal as="li" key={p.id} delay={i * 80}>
            <PostCard post={p} />
          </Reveal>
        ))}
      </ul>
    </SectionShell>
  );
}
