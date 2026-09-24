import { z } from 'zod';

/** Plain text: trimmed, control characters removed, length-limited. */
export const text = (max = 200) =>
  z
    .string()
    .transform((v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim())
    .pipe(z.string().max(max, `Must be at most ${max} characters`));

export const requiredText = (max = 200, label = 'This field') =>
  text(max).pipe(z.string().min(1, `${label} is required`));

/** Long-form Markdown. Rendered on the client without raw HTML support (XSS-safe). */
export const markdown = (max = 20000) => text(max);

const isSafeUrl = (v) => {
  if (v === '') return true;
  if (v.startsWith('/uploads/')) return !v.includes('..');
  try {
    const u = new URL(v);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
};

/** Optional http(s) URL (or a locally stored `/uploads/...` media path). Blocks javascript:/data: URLs. */
export const url = () =>
  z
    .string()
    .trim()
    .max(2048)
    .refine(isSafeUrl, 'Must be a valid http(s) URL');

export const mailOrTel = () =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === '' || isSafeUrl(v) || /^mailto:[^\s]+$/.test(v) || /^tel:[+\d\s()-]+$/.test(v), 'Must be a valid URL, mailto: or tel: link');

export const email = () => z.string().trim().toLowerCase().max(254).pipe(z.email('Must be a valid e-mail address'));
export const optionalEmail = () => z.union([z.literal(''), email()]);

export const tags = (maxItems = 40, maxLen = 60) =>
  z
    .array(text(maxLen))
    .max(maxItems)
    .transform((arr) => [...new Set(arr.filter(Boolean))]);

export const hexColor = () => z.string().trim().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, 'Must be a hex colour like #4f8cff');

export const image = () =>
  z
    .object({
      url: url().optional(),
      alt: text(200).optional(),
    })
    .strict();

export const objectId = () => z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const baseItem = {
  order: z.coerce.number().int().min(0).max(100000).optional(),
  isPublished: z.boolean().optional(),
};
