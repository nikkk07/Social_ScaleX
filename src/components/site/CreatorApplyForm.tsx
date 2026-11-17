'use client';
// The creator application. A real form that posts to the CRM (works with JavaScript off: the CRM redirects to
// /creators/thanks). With JavaScript, it sends with fetch and answers in place. Nothing is stored in the browser.
import React, { useEffect, useId, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CONSENT_TEXT, CONTENT_TYPES, CRM_INTAKE, LANGUAGES, NICHES } from '@/lib/creators';
import { trackCreatorApply } from '@/lib/track';

const TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
const INDIAN_MOBILE = /^(?:\+?91|0)?[6-9]\d{9}$/;

/** Latest date of birth that is 18 today (IST), for the date input's max. */
function maxBirth(): string {
  const d = new Date(Date.now() + 19_800_000);
  d.setUTCFullYear(d.getUTCFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

export function CreatorApplyForm({ brief, briefTitle, returnUrl }: { brief?: string; briefTitle?: string; returnUrl: string }) {
  const id = useId();
  const f = (n: string) => `${id}-${n}`;
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [again, setAgain] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!TURNSTILE || document.querySelector('script[data-turnstile]')) return;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true; s.defer = true; s.dataset.turnstile = '1';
    document.head.appendChild(s);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const phone = String(fd.get('phone') ?? '').replace(/[\s-]/g, '');
    if (!INDIAN_MOBILE.test(phone)) { setState('error'); setMessage('Enter a 10-digit Indian mobile number.'); return; }
    const many = (k: string) => fd.getAll(k).map(String).map((s) => s.trim()).filter(Boolean);
    const body = {
      brief: brief ?? '', full_name: fd.get('full_name'), phone, email: fd.get('email'), city: fd.get('city'), birth_date: fd.get('birth_date'),
      instagram: fd.get('instagram'), youtube: fd.get('youtube'), followers: fd.get('followers'), niches: many('niches'), languages: many('languages'),
      content_types: many('content_types'), samples: many('samples'), rate: fd.get('rate'), rate_note: fd.get('rate_note'), pitch: fd.get('pitch'),
      consent: fd.get('consent') === 'on', website: fd.get('website'), 'cf-turnstile-response': fd.get('cf-turnstile-response') ?? '',
    };
    setState('sending'); setMessage('');
    try {
      const r = await fetch(CRM_INTAKE, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const j = (await r.json().catch(() => ({}))) as { ok?: boolean; message?: string; again?: boolean };
      if (j.ok) {
        setAgain(Boolean(j.again)); setState('done'); trackCreatorApply(brief ? 'brief' : 'network');
        formRef.current?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      setState('error'); setMessage(j.message ?? 'That didn’t send. Please try again, or message us on WhatsApp.');
    } catch {
      setState('error'); setMessage('That didn’t send. Check your connection and try again, or message us on WhatsApp.');
    }
  }

  if (state === 'done') {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-6">
        <CheckCircle2 className="mb-3 size-7 text-positive" aria-hidden />
        <p className="font-display text-xl text-ink">{again ? 'Updated. We have your latest details.' : 'Application sent. Thank you!'}</p>
        <p className="mt-2 text-ink-2">A person on our team reads every application{briefTitle ? ` for “${briefTitle}”` : ''}. If you gave an e-mail, a confirmation is on its way. We reply by WhatsApp or e-mail either way.</p>
      </div>
    );
  }

  const chip = 'inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm has-[:checked]:border-ink has-[:checked]:bg-paper-2';
  return (
    <form ref={formRef} action={CRM_INTAKE} method="post" onSubmit={onSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2" noValidate={false}>
      <input type="hidden" name="brief" value={brief ?? ''} />
      <input type="hidden" name="return" value={returnUrl} />
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={f('website')}>Leave this empty</label><input id={f('website')} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('full_name')}>Full name</label>
        <input id={f('full_name')} name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="field" /></div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('phone')}>WhatsApp number</label>
        <input id={f('phone')} name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="98765 43210" className="field" /></div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('email')}>E-mail <span className="font-normal text-ink-3">(for the confirmation)</span></label>
        <input id={f('email')} name="email" type="email" autoComplete="email" maxLength={200} className="field" /></div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('birth_date')}>Date of birth <span className="font-normal text-ink-3">(18+ only)</span></label>
        <input id={f('birth_date')} name="birth_date" type="date" required max={maxBirth()} min="1930-01-01" className="field" /></div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('city')}>City</label>
        <input id={f('city')} name="city" required maxLength={80} autoComplete="address-level2" className="field" /></div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('instagram')}>Instagram handle</label>
        <input id={f('instagram')} name="instagram" required maxLength={60} placeholder="@yourhandle" className="field" /></div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('followers')}>Instagram followers <span className="font-normal text-ink-3">(roughly)</span></label>
        <input id={f('followers')} name="followers" inputMode="numeric" pattern="[0-9]*" maxLength={10} className="field" /></div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('youtube')}>YouTube channel <span className="font-normal text-ink-3">(optional)</span></label>
        <input id={f('youtube')} name="youtube" type="url" placeholder="https://youtube.com/@…" maxLength={300} className="field" /></div>

      <fieldset className="sm:col-span-2"><legend className="mb-1.5 block text-sm font-semibold text-ink">What you make</legend>
        <div className="flex flex-wrap gap-2">{Object.entries(CONTENT_TYPES).map(([k, l]) => (
          <label key={k} className={chip}><input type="checkbox" name="content_types" value={k} className="size-4 accent-[#C23A22]" />{l}</label>))}</div></fieldset>
      <fieldset className="sm:col-span-2"><legend className="mb-1.5 block text-sm font-semibold text-ink">Your niches</legend>
        <div className="flex flex-wrap gap-2">{NICHES.map((n) => (
          <label key={n} className={chip}><input type="checkbox" name="niches" value={n} className="size-4 accent-[#C23A22]" />{n}</label>))}</div></fieldset>
      <fieldset className="sm:col-span-2"><legend className="mb-1.5 block text-sm font-semibold text-ink">Languages you create in</legend>
        <div className="flex flex-wrap gap-2">{LANGUAGES.map((n) => (
          <label key={n} className={chip}><input type="checkbox" name="languages" value={n} className="size-4 accent-[#C23A22]" />{n}</label>))}</div></fieldset>

      <fieldset className="sm:col-span-2"><legend className="mb-1.5 block text-sm font-semibold text-ink">2–3 links to your best work</legend>
        <div className="grid gap-2">{[0, 1, 2].map((i) => (
          <input key={i} name="samples" type="url" required={i === 0} placeholder={i === 0 ? 'https://www.instagram.com/reel/…' : 'Another link (optional)'} maxLength={300} aria-label={`Sample link ${i + 1}`} className="field" />))}</div>
        <p className="mt-1.5 text-xs text-ink-3">Public links: Reels, YouTube, Google Drive or a portfolio site.</p></fieldset>

      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('rate')}>Your rate (₹){brief ? ' for this brief' : ' per video'}</label>
        <input id={f('rate')} name="rate" inputMode="numeric" pattern="[0-9]*" maxLength={8} className="field" /></div>
      <div><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('rate_note')}>Rate note <span className="font-normal text-ink-3">(optional)</span></label>
        <input id={f('rate_note')} name="rate_note" maxLength={200} placeholder="e.g. includes 1 revision" className="field" /></div>
      <div className="sm:col-span-2"><label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor={f('pitch')}>{brief ? 'Why you’re right for this brief' : 'Tell us about you'} <span className="font-normal text-ink-3">(optional)</span></label>
        <textarea id={f('pitch')} name="pitch" maxLength={1500} rows={4} className="field" /></div>

      <label className="flex items-start gap-3 text-sm text-ink-2 sm:col-span-2">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-[#C23A22]" />
        <span>{CONSENT_TEXT} See our <a href="/privacy" className="underline">privacy policy</a>.</span>
      </label>
      {TURNSTILE ? <div className="cf-turnstile sm:col-span-2" data-sitekey={TURNSTILE} /> : null}
      <div className="sm:col-span-2">
        <button type="submit" disabled={state === 'sending'} className="btn btn-primary btn-lg w-full sm:w-auto">{state === 'sending' ? 'Sending…' : brief ? 'Apply for this brief' : 'Join the creator network'}</button>
        <p role="alert" aria-live="polite" className="mt-3 text-sm text-critical">{state === 'error' ? message : ''}</p>
      </div>
    </form>
  );
}
