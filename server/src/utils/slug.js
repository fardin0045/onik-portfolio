export function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Returns a slug that is unique within `Model` (ignoring the document `excludeId`). */
export async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base) || 'item';
  let candidate = root;
  for (let i = 2; ; i += 1) {
    const filter = { slug: candidate };
    if (excludeId) filter._id = { $ne: excludeId };
    // eslint-disable-next-line no-await-in-loop
    const exists = await Model.exists(filter);
    if (!exists) return candidate;
    candidate = `${root}-${i}`;
  }
}
