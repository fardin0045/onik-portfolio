import { Check, Copy, Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button.jsx';
import { SocialLinks } from '../components/ui/SocialIcon.jsx';
import { Reveal } from '../hooks/useReveal.jsx';
import { api } from '../lib/api.js';
import { SectionShell } from './SectionShell.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error('Could not copy to clipboard');
        }
      }}
      className="inline-flex size-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={copied ? 'Copied' : `Copy ${label}`}
    >
      {copied ? <Check className="size-4 text-success" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
    </button>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Contact({ site, section }) {
  const { contact } = site.profile;
  // When the form was rendered – submissions faster than a human could type are dropped as spam.
  const [startedAt] = useState(() => Date.now());
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', email: '', subject: '', message: '', website: '' } });

  const onSubmit = async (values) => {
    try {
      await api.post('/public/contact', { ...values, startedAt });
      toast.success('Message sent — thank you! I will get back to you soon.');
      reset();
      setSent(true);
    } catch (err) {
      if (err.fields) Object.entries(err.fields).forEach(([k, msg]) => setError(k, { message: msg }));
      toast.error(err.status === 429 ? 'Too many messages. Please try again later.' : err.message || 'Could not send your message.');
    }
  };

  const info = [
    contact.email && { icon: Mail, label: 'Email', value: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: Phone, label: 'Phone', value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, '')}` },
    contact.location && { icon: MapPin, label: 'Location', value: contact.location },
  ].filter(Boolean);

  const aria = (name) => ({ 'aria-invalid': errors[name] ? 'true' : 'false', 'aria-describedby': errors[name] ? `contact-${name}-error` : undefined });

  return (
    <SectionShell section={section} alt>
      <div className={contact.formEnabled ? 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12' : 'max-w-xl'}>
        <Reveal className="space-y-4">
          {contact.note && <p className="text-muted">{contact.note}</p>}
          {info.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="card flex items-center gap-4 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wide text-subtle uppercase">{label}</p>
                {href ? (
                  <a href={href} className="block truncate text-sm font-medium text-fg hover:text-primary-ink">
                    {value}
                  </a>
                ) : (
                  <p className="truncate text-sm font-medium text-fg">{value}</p>
                )}
              </div>
              {href && <CopyButton value={value} label={label.toLowerCase()} />}
            </div>
          ))}
          {site.socialLinks.length > 0 && (
            <div className="pt-2">
              <p className="mb-3 text-sm text-muted">Or find me on</p>
              <SocialLinks links={site.socialLinks} />
            </div>
          )}
        </Reveal>

        {contact.formEnabled && (
          <Reveal delay={100}>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-5 p-6 sm:p-8" aria-label="Contact form">
              {sent && (
                <p role="status" className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                  Thanks! Your message has been delivered.
                </p>
              )}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="contact-name" label="Name" error={errors.name?.message}>
                  <input
                    id="contact-name"
                    className="input"
                    autoComplete="name"
                    {...aria('name')}
                    {...register('name', { required: 'Please enter your name', minLength: { value: 2, message: 'Name is too short' }, maxLength: { value: 100, message: 'Name is too long' } })}
                  />
                </Field>
                <Field id="contact-email" label="Email" error={errors.email?.message}>
                  <input
                    id="contact-email"
                    type="email"
                    className="input"
                    autoComplete="email"
                    {...aria('email')}
                    {...register('email', { required: 'Please enter your email', pattern: { value: EMAIL_RE, message: 'Please enter a valid email' } })}
                  />
                </Field>
              </div>
              <Field id="contact-subject" label="Subject" error={errors.subject?.message}>
                <input
                  id="contact-subject"
                  className="input"
                  {...aria('subject')}
                  {...register('subject', { required: 'Please add a subject', minLength: { value: 3, message: 'Subject is too short' }, maxLength: { value: 150, message: 'Subject is too long' } })}
                />
              </Field>
              <Field id="contact-message" label="Message" error={errors.message?.message}>
                <textarea
                  id="contact-message"
                  rows={6}
                  className="input resize-y"
                  {...aria('message')}
                  {...register('message', { required: 'Please write a message', minLength: { value: 10, message: 'Message is too short (min. 10 characters)' }, maxLength: { value: 5000, message: 'Message is too long' } })}
                />
              </Field>
              {/* Honeypot – invisible to humans, bots fill it in. */}
              <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input id="contact-website" tabIndex={-1} autoComplete="off" {...register('website')} />
              </div>
              <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
                {!isSubmitting && <Send className="size-4" aria-hidden="true" />} Send message
              </Button>
            </form>
          </Reveal>
        )}
      </div>
    </SectionShell>
  );
}
