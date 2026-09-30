'use client';
import React, { useId, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { submitEnquiry, type SubmitResult } from './submitEnquiry';

/** Indian mobile: 10 digits starting 6–9, optional +91 / 0 prefix, spaces or hyphens. */
const INDIAN_MOBILE = /^(?:\+?91|0)?[6-9]\d{9}$/;

type Errors = Partial<Record<'name' | 'phone', string>>;

function validate(name: string, phone: string): Errors {
  const e: Errors = {};
  if (name.trim().length < 2) e.name = 'Please enter your name.';
  if (!INDIAN_MOBILE.test(phone.replace(/[\s-]/g, ''))) e.phone = 'Enter a 10-digit mobile number.';
  return e;
}

function failureText(r: Exclude<SubmitResult, { ok: true }>, phone: string): string {
  if (r.kind === 'throttled') {
    const mins = Math.ceil(r.retryAfterMs / 60_000);
    return mins <= 1
      ? `You’ve just sent us something. Give it a moment, or call ${phone}.`
      : `You’ve sent a few already. Try again in about ${mins} minutes, or call ${phone}.`;
  }
  return `That didn’t send. Please call or WhatsApp ${phone} and we’ll pick it up straight away.`;
}

export function LeadForm({
  services,
  phoneLabel,
  whatsappHref,
  defaultService = '',
}: {
  services: string[];
  phoneLabel: string;
  whatsappHref: string;
  defaultService?: string;
}) {
  const uid = useId();
  const pathname = usePathname();
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? '').trim();
    const name = get('name');
    const phone = get('phone');
    const found = validate(name, phone);
    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length) {
      const first = ev.currentTarget.querySelector<HTMLInputElement>(`[name="${found.name ? 'name' : 'phone'}"]`);
      first?.focus();
      return;
    }
    if (get('company')) {
      setFailure(`We couldn’t verify that. Please call or WhatsApp ${phone}.`);
      return;
    }
    const service = get('service');
    const handle = get('handle');
    const details = get('details');
    const message = [
      service ? `Service: ${service}` : null,
      handle ? `Instagram / website: ${handle}` : null,
      `Page: ${pathname}`,
      details ? `\n${details}` : null,
    ].filter(Boolean).join('\n');

    setBusy(true);
    const result = await submitEnquiry({ kind: 'callback', name, phone, best_time: null, message });
    setBusy(false);
    if (result.ok) setSentTo(name.split(' ')[0] ?? name);
    else setFailure(failureText(result, phoneLabel));
  }

  if (sentTo) {
    return (
      <div role="status" className="py-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-positive" aria-hidden="true" />
        <p className="mt-4 font-display text-2xl text-ink">Thanks, {sentTo}. We’ve got it.</p>
        <p className="mt-2 text-ink-2">We usually call back within a few hours, during business hours.</p>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-6">
          Can’t wait? WhatsApp us
        </a>
      </div>
    );
  }

  const f = (k: string) => `${uid}-${k}`;
  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5" aria-describedby={`${f('note')}`}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={f('name')} className="mb-1.5 block text-sm font-semibold text-ink">Your name</label>
          <input id={f('name')} name="name" autoComplete="name" required className="field"
            aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? f('name-err') : undefined} />
          {errors.name ? <p id={f('name-err')} className="mt-1.5 text-sm text-critical">{errors.name}</p> : null}
        </div>
        <div>
          <label htmlFor={f('phone')} className="mb-1.5 block text-sm font-semibold text-ink">Mobile number</label>
          <input id={f('phone')} name="phone" type="tel" inputMode="tel" autoComplete="tel" required placeholder="98765 43210" className="field"
            aria-invalid={errors.phone ? true : undefined} aria-describedby={errors.phone ? f('phone-err') : undefined} />
          {errors.phone ? <p id={f('phone-err')} className="mt-1.5 text-sm text-critical">{errors.phone}</p> : null}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={f('service')} className="mb-1.5 block text-sm font-semibold text-ink">What do you need?</label>
          <select id={f('service')} name="service" defaultValue={defaultService} className="field">
            <option value="">Not sure yet</option>
            {services.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={f('handle')} className="mb-1.5 block text-sm font-semibold text-ink">
            Instagram or website <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <input id={f('handle')} name="handle" autoComplete="url" placeholder="@yourbrand" maxLength={200} className="field" />
        </div>
      </div>
      <div>
        <label htmlFor={f('details')} className="mb-1.5 block text-sm font-semibold text-ink">
          Anything we should know? <span className="font-normal text-ink-3">(optional)</span>
        </label>
        <textarea id={f('details')} name="details" rows={3} maxLength={2000} className="field resize-y" />
      </div>
      <div className="absolute -left-[9999px] size-px overflow-hidden" aria-hidden="true">
        <label>Company<input type="text" name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div role="status" aria-live="polite">
        {failure ? <p className="rounded-xl bg-coral-tint px-4 py-3 text-sm text-ink">{failure}</p> : null}
      </div>
      <button type="submit" disabled={busy} className="btn btn-primary btn-lg w-full">
        {busy ? 'Sending…' : 'Book my free strategy call'}
      </button>
      <p id={f('note')} className="text-center text-xs text-ink-3">
        No spam and no sharing. We only use your number to call you back.
      </p>
    </form>
  );
}
