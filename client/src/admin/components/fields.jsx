import { ArrowDown, ArrowUp, Eye, FileText, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { lazy, Suspense, useId, useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '../../components/ui/Button.jsx';
import { cn, imageUrl, mediaUrl } from '../../lib/utils.js';
import { MediaPicker } from './MediaPicker.jsx';

const Markdown = lazy(() => import('../../components/ui/Markdown.jsx').then((m) => ({ default: m.Markdown })));

const URL_RE = /^(https?:\/\/[^\s]+|\/uploads\/[^\s]+)$/;

export const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
export function setPath(obj, path, value) {
  const keys = path.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k) => {
    o[k] ??= {};
    o = o[k];
  });
  o[keys.at(-1)] = value;
  return obj;
}

/** Default (empty) value for a field type. */
export function emptyValue(field) {
  if (field.defaultValue !== undefined) return field.defaultValue;
  switch (field.type) {
    case 'switch':
      return false;
    case 'tags':
    case 'lines':
    case 'gallery':
    case 'repeater':
      return [];
    case 'image':
      return { url: '', alt: '' };
    case 'number':
      return '';
    default:
      return '';
  }
}

/** Builds the API payload from form values – only configured fields are sent. */
export function toPayload(values, fields) {
  const out = {};
  fields.forEach((f) => {
    let v = getPath(values, f.name);
    if (f.type === 'number') v = v === '' || v === null || Number.isNaN(Number(v)) ? undefined : Number(v);
    if (f.type === 'image') v = { url: v?.url || '', alt: v?.alt || '' };
    if (f.type === 'gallery') v = (v || []).filter((i) => i?.url).map((i) => ({ url: i.url, alt: i.alt || '' }));
    if (f.type === 'repeater') v = (v || []).map((row) => Object.fromEntries(f.fields.map((sf) => [sf.name, row?.[sf.name] ?? ''])));
    if (v !== undefined) setPath(out, f.name, v);
  });
  return out;
}

export function defaultsFor(fields, item = {}) {
  const out = {};
  fields.forEach((f) => {
    const v = getPath(item, f.name);
    setPath(out, f.name, v === undefined || v === null ? emptyValue(f) : v);
  });
  return out;
}

function rulesFor(f) {
  const r = {};
  if (f.required) r.required = `${f.label} is required`;
  if (f.maxLength) r.maxLength = { value: f.maxLength, message: `Maximum ${f.maxLength} characters` };
  if (f.type === 'url') r.validate = (v) => !v || URL_RE.test(v) || 'Must be a valid URL starting with https://';
  if (f.type === 'email') r.pattern = { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Must be a valid e-mail' };
  if (f.pattern) r.pattern = { value: f.pattern, message: f.patternMessage || 'Invalid format' };
  if (f.type === 'number') {
    if (f.min !== undefined) r.min = { value: f.min, message: `Minimum ${f.min}` };
    if (f.max !== undefined) r.max = { value: f.max, message: `Maximum ${f.max}` };
  }
  if (f.type === 'color') r.pattern = { value: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i, message: 'Use a hex colour like #5b8cff' };
  return r;
}

export function FieldShell({ id, field, error, children, counter }) {
  return (
    <div className={cn(field.span === 2 && 'sm:col-span-2')}>
      {field.type !== 'switch' && (
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={id} className="label">
            {field.label}
            {field.required && (
              <span className="text-danger" aria-hidden="true">
                {' '}
                *
              </span>
            )}
          </label>
          {counter}
        </div>
      )}
      {children}
      {field.help && !error && (
        <p id={`${id}-help`} className="mt-1.5 text-xs text-subtle">
          {field.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function TagsInput({ id, value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const add = (raw) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setDraft('');
  };
  return (
    <div className="input flex min-h-11 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-soft">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-surface-2 py-0.5 pr-1 pl-2 text-xs font-medium">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="rounded p-0.5 text-subtle hover:text-danger" aria-label={`Remove ${t}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)}
        placeholder={value.length ? '' : placeholder || 'Type and press Enter'}
        className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none"
      />
    </div>
  );
}

function MarkdownInput({ id, field, register, describedBy, invalid }) {
  const [preview, setPreview] = useState(false);
  const { watch } = useFormContext();
  const value = watch(field.name);
  return (
    <div>
      <div className="mb-2 flex gap-1">
        {[false, true].map((p) => (
          <button
            key={String(p)}
            type="button"
            onClick={() => setPreview(p)}
            aria-pressed={preview === p}
            className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium', preview === p ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg')}
          >
            {p ? <Eye className="size-3.5" /> : <Pencil className="size-3.5" />} {p ? 'Preview' : 'Write'}
          </button>
        ))}
      </div>
      {preview ? (
        <div className="min-h-32 rounded-xl border border-border bg-bg p-4">
          <Suspense fallback={null}>{value ? <Markdown>{value}</Markdown> : <p className="text-sm text-subtle">Nothing to preview.</p>}</Suspense>
        </div>
      ) : (
        <textarea
          id={id}
          rows={field.rows || 8}
          className="input resize-y font-mono text-[0.8rem] leading-6"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          {...register(field.name, rulesFor(field))}
        />
      )}
    </div>
  );
}

export function ImageInput({ id, value, onChange, folder, purpose, compact = false, noAlt = false }) {
  const [open, setOpen] = useState(false);
  const url = value?.url;
  return (
    <div className={cn('flex gap-4', compact ? 'items-center' : 'flex-col sm:flex-row sm:items-start')}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-strong bg-surface-2 text-subtle hover:border-primary',
          compact ? 'size-16' : 'aspect-[16/10] w-full sm:w-56',
        )}
        aria-label={url ? 'Replace image' : 'Choose image'}
      >
        {url ? <img src={imageUrl(url, 480)} alt="" className="size-full object-cover" /> : <ImagePlus className="size-6" />}
      </button>
      {!compact && (
        <div className="flex-1 space-y-2">
          {!noAlt && (
          <input
            className="input"
            placeholder="Alt text (describe the image for screen readers)"
            aria-label="Image alt text"
            value={value?.alt || ''}
            maxLength={200}
            onChange={(e) => onChange({ url: url || '', alt: e.target.value })}
          />
          )}
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              {url ? 'Replace' : 'Choose image'}
            </Button>
            {url && (
              <Button size="sm" variant="ghost" onClick={() => onChange({ url: '', alt: value?.alt || '' })}>
                <Trash2 className="size-3.5" /> Remove
              </Button>
            )}
          </div>
        </div>
      )}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        folder={folder}
        purpose={purpose}
        onSelect={(m) => onChange({ url: m.url, alt: value?.alt || m.alt || '' })}
      />
    </div>
  );
}

function GalleryInput({ value = [], onChange, folder }) {
  const [open, setOpen] = useState(false);
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((img, i) => (
            <li key={`${img.url}-${i}`} className="overflow-hidden rounded-xl border border-border bg-surface-2">
              <img src={imageUrl(img.url, 400)} alt="" className="aspect-[16/10] w-full object-cover" />
              <div className="flex items-center gap-1 p-1.5">
                <input
                  className="min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-xs outline-none focus:bg-surface"
                  placeholder="Alt text"
                  aria-label={`Alt text for image ${i + 1}`}
                  value={img.alt || ''}
                  onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                />
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 text-subtle hover:text-fg disabled:opacity-30" aria-label="Move left">
                  <ArrowUp className="size-3.5 -rotate-90" />
                </button>
                <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} className="rounded p-1 text-subtle hover:text-fg disabled:opacity-30" aria-label="Move right">
                  <ArrowDown className="size-3.5 -rotate-90" />
                </button>
                <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded p-1 text-subtle hover:text-danger" aria-label="Remove image">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)} disabled={value.length >= 20}>
        <Plus className="size-4" /> Add image
      </Button>
      <MediaPicker open={open} onClose={() => setOpen(false)} folder={folder} onSelect={(m) => onChange([...value, { url: m.url, alt: m.alt || '' }])} />
    </div>
  );
}

export function DocumentInput({ id, value, onChange, folder = 'resume', onUploaded }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
      <span className="flex size-10 items-center justify-center rounded-lg bg-surface text-primary-ink">
        <FileText className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        {value ? (
          <a href={mediaUrl(value)} target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-medium text-primary-ink hover:underline">
            {value.split('/').pop()}
          </a>
        ) : (
          <p className="text-sm text-muted">No file uploaded</p>
        )}
      </div>
      <Button id={id} size="sm" variant="secondary" onClick={() => setOpen(true)}>
        {value ? 'Replace PDF' : 'Upload PDF'}
      </Button>
      {value && (
        <Button size="sm" variant="ghost" onClick={() => onChange('')}>
          Remove
        </Button>
      )}
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        kind="document"
        folder={folder}
        onSelect={(m) => {
          onChange(m.url);
          onUploaded?.(m);
        }}
      />
    </div>
  );
}

function RepeaterInput({ field }) {
  const { control, register } = useFormContext();
  const { fields, append, remove, move } = useFieldArray({ control, name: field.name });
  return (
    <div className="space-y-2">
      {fields.map((row, i) => (
        <div key={row.id} className="flex items-start gap-2 rounded-xl border border-border bg-surface-2 p-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr]">
            {field.fields.map((sf) => (
              <input
                key={sf.name}
                className="input py-2"
                placeholder={sf.label}
                aria-label={`${sf.label} ${i + 1}`}
                maxLength={sf.maxLength}
                {...register(`${field.name}.${i}.${sf.name}`, { required: `${sf.label} is required` })}
              />
            ))}
          </div>
          <div className="flex flex-col">
            <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} className="rounded p-1 text-subtle hover:text-fg disabled:opacity-30" aria-label="Move up">
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} className="rounded p-1 text-subtle hover:text-fg disabled:opacity-30" aria-label="Move down">
              <ArrowDown className="size-3.5" />
            </button>
          </div>
          <button type="button" onClick={() => remove(i)} className="rounded p-1.5 text-subtle hover:text-danger" aria-label="Remove row">
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      {(!field.max || fields.length < field.max) && (
        <Button size="sm" variant="secondary" onClick={() => append(Object.fromEntries(field.fields.map((sf) => [sf.name, ''])))}>
          <Plus className="size-4" /> Add {field.itemLabel || 'item'}
        </Button>
      )}
    </div>
  );
}

/** Renders one configured field inside a react-hook-form FormProvider. */
export function Field({ field, folder, suggestions }) {
  const id = useId();
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();
  const error = getPath(errors, field.name)?.message;
  const describedBy = error ? `${id}-error` : field.help ? `${id}-help` : undefined;
  const common = { id, 'aria-invalid': error ? 'true' : 'false', 'aria-describedby': describedBy };
  const value = ['text', 'textarea', 'markdown'].includes(field.type) && field.maxLength ? watch(field.name) : null;
  const counter =
    value != null && field.maxLength >= 200 ? (
      <span className={cn('text-xs tabular-nums', value.length > field.maxLength ? 'text-danger' : 'text-subtle')}>
        {value.length}/{field.maxLength}
      </span>
    ) : null;

  let input;
  switch (field.type) {
    case 'textarea':
      input = <textarea rows={field.rows || 4} className="input resize-y" placeholder={field.placeholder} {...common} {...register(field.name, rulesFor(field))} />;
      break;
    case 'markdown':
      input = <MarkdownInput id={id} field={field} register={register} describedBy={describedBy} invalid={common['aria-invalid']} />;
      break;
    case 'switch':
      input = (
        <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 hover:bg-surface-2">
          <input type="checkbox" className="peer sr-only" {...common} {...register(field.name)} />
          <span
            aria-hidden="true"
            className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full bg-border-strong transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4"
          />
          <span className="text-sm font-medium">{field.label}</span>
        </label>
      );
      break;
    case 'select':
      input = (
        <select className="input" {...common} {...register(field.name, rulesFor(field))}>
          {!field.required && <option value="">—</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case 'number':
      input = <input type="number" inputMode="numeric" className="input" min={field.min} max={field.max} {...common} {...register(field.name, rulesFor(field))} />;
      break;
    case 'color':
      input = (
        <Controller
          control={control}
          name={field.name}
          rules={rulesFor(field)}
          render={({ field: f }) => (
            <div className="flex items-center gap-3">
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(f.value) ? f.value : '#5b8cff'} onChange={(e) => f.onChange(e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-surface p-1" aria-label={`${field.label} picker`} />
              <input className="input font-mono" {...common} value={f.value || ''} onChange={f.onChange} onBlur={f.onBlur} />
            </div>
          )}
        />
      );
      break;
    case 'tags':
      input = <Controller control={control} name={field.name} render={({ field: f }) => <TagsInput id={id} value={f.value || []} onChange={f.onChange} placeholder={field.placeholder} />} />;
      break;
    case 'lines':
      input = (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <textarea
              rows={field.rows || 4}
              className="input resize-y"
              {...common}
              defaultValue={(f.value || []).join('\n')}
              onChange={(e) => f.onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
              onBlur={f.onBlur}
            />
          )}
        />
      );
      break;
    case 'image':
      input = <Controller control={control} name={field.name} render={({ field: f }) => <ImageInput id={id} value={f.value} onChange={f.onChange} folder={field.folder || folder} purpose={field.purpose} />} />;
      break;
    case 'imageUrl':
      // Image stored as a plain URL string (favicon, social share image).
      input = (
        <Controller
          control={control}
          name={field.name}
          render={({ field: f }) => (
            <ImageInput id={id} noAlt value={{ url: f.value || '', alt: '' }} onChange={(v) => f.onChange(v.url)} folder={field.folder || folder} purpose={field.purpose} />
          )}
        />
      );
      break;
    case 'gallery':
      input = <Controller control={control} name={field.name} render={({ field: f }) => <GalleryInput value={f.value || []} onChange={f.onChange} folder={field.folder || folder} />} />;
      break;
    case 'document':
      input = <Controller control={control} name={field.name} render={({ field: f }) => <DocumentInput id={id} value={f.value} onChange={f.onChange} folder={field.folder} onUploaded={(m) => field.onUploaded?.(m, { setValue })} />} />;
      break;
    case 'repeater':
      input = <RepeaterInput field={field} />;
      break;
    case 'custom':
      input = field.render();
      break;
    default: {
      const listId = suggestions?.length ? `${id}-list` : undefined;
      input = (
        <>
          <input
            type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
            className="input"
            placeholder={field.placeholder || (field.type === 'url' ? 'https://' : undefined)}
            list={listId}
            {...common}
            {...register(field.name, rulesFor(field))}
          />
          {listId && (
            <datalist id={listId}>
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
        </>
      );
    }
  }

  return (
    <FieldShell id={id} field={field} error={error} counter={counter}>
      {input}
    </FieldShell>
  );
}
