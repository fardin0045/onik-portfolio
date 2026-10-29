import { createElement } from 'react';
import { Code2, Cpu, Database, Layers, Monitor, Server, Sparkles, Wrench } from 'lucide-react';
import { TechIcon } from '../components/ui/TechIcon.jsx';
import { TechOrbit } from '../components/ui/TechOrbit.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { groupBy } from '../lib/utils.js';
import { SectionShell } from './SectionShell.jsx';

const CATEGORY_ICONS = [
  [/(^|\s)ai(\s|$)|artificial|llm/i, Sparkles],
  [/language|programming/i, Code2],
  [/front/i, Monitor],
  [/back|api|server/i, Server],
  [/data/i, Database],
  [/tool|platform|devops/i, Wrench],
  [/concept|core|fundamental/i, Cpu],
];
const iconFor = (category) => CATEGORY_ICONS.find(([re]) => re.test(category))?.[1] || Layers;

/** Rough card height: header + chip rows (≈ 2.5 chips per row in a side column). */
const estimate = ([, items]) => 2 + Math.ceil(items.length / 2.5);

/**
 * Desktop distribution: side columns balanced by estimated height; with an odd number of
 * categories the last one sits in the centre column under the orbit, so no column runs long.
 */
function distribute(groups) {
  const center = groups.length % 2 === 1 ? [groups.at(-1)] : [];
  const rest = center.length ? groups.slice(0, -1) : groups;
  const cols = [[], []];
  const height = [0, 0];
  rest.forEach((g) => {
    const i = height[0] <= height[1] ? 0 : 1;
    cols[i].push(g);
    height[i] += estimate(g);
  });
  return [cols[0], center, cols[1]];
}

function SkillCard({ category, items, delay, order }) {
  return (
    <Reveal
      delay={delay}
      style={{
        // Small screens: follow the admin-defined order (columns are flattened with display: contents).
        order,
        // Mobile only (see .reveal-slide): odd cards slide in from the left, even ones from the right.
        '--slide-x': order % 2 ? '-56px' : '56px',
      }}
      className="reveal-slide card spotlight group/card grow basis-[18rem] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-border-strong lg:basis-auto"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-ink ring-1 ring-primary/20 transition-transform duration-300 group-hover/card:scale-110 group-hover/card:-rotate-6">
          {createElement(iconFor(category), { className: 'size-5', 'aria-hidden': true })}
        </span>
        <h3 className="text-base font-semibold">{category}</h3>
        <span className="ml-auto font-mono text-xs text-subtle">{String(items.length).padStart(2, '0')}</span>
      </div>
      <ul className="flex flex-wrap gap-2" aria-label={`${category} skills`}>
        {items.map((s, i) => (
          <li
            key={s.id}
            style={{ '--chip-delay': `${delay + 600 + Math.min(i, 12) * 90}ms` }}
            className="reveal-chip group inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2/70 px-3 py-1.5 text-[0.82rem] font-medium text-fg/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-2 hover:shadow-md"
          >
            <TechIcon name={s.name} className="size-4 transition-transform duration-300 group-hover:scale-110" colored />
            {s.name}
            {typeof s.level === 'number' && s.level > 0 && <span className="font-mono text-[0.7rem] text-subtle">{s.level}%</span>}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

/**
 * Toolkit layout
 *  - Desktop (lg+): balanced card columns either side of a spinning tech orbit.
 *  - Tablet/mobile: the orbit on top, cards in a fluid wrap grid (a lone last card fills its row).
 *    On scroll the cards slide in alternately from the left and right, then their chips pop in.
 * Column wrappers use `display: contents` below lg so every card joins the same flex-wrap row.
 */
export default function Skills({ site, section }) {
  const groups = Object.entries(groupBy(site.skills, 'category'));
  const [left, center, right] = distribute(groups);
  const position = new Map(groups.map(([category], i) => [category, i + 1]));
  const column = (list, offset) =>
    list.map(([category, items], i) => (
      <SkillCard key={category} category={category} items={items} order={position.get(category)} delay={((i + offset) % 3) * 90} />
    ));

  // overflow-x-clip: the rotating rings' bounding boxes must not widen the page.
  return (
    <SectionShell section={section} alt className="overflow-x-clip">
      <div className="flex flex-wrap gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)_minmax(0,1fr)] lg:items-start lg:gap-6">
        <div className="contents lg:flex lg:flex-col lg:gap-6">{column(left, 0)}</div>
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-first mb-2 basis-full sm:mb-6 lg:order-none lg:mb-0 lg:py-2">
            <Reveal>
              <TechOrbit skills={site.skills} label={section.title} />
            </Reveal>
          </div>
          {column(center, 2)}
        </div>
        <div className="contents lg:flex lg:flex-col lg:gap-6">{column(right, 1)}</div>
      </div>
    </SectionShell>
  );
}
