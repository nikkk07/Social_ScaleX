'use client';
// A real <form> split into steps. Progressive enhancement: before JavaScript runs (or without it) every step is
// visible and the form posts normally to the CRM, which redirects back to a thanks page. Once hydrated it shows one
// step at a time with a progress bar, checks each step before moving on, sends with fetch and answers in place.
// Hidden steps stay in the DOM, so nothing typed is lost when going back and forth. Nothing is stored in the browser.
import React, { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

export interface Step { id: string; title: string; hint?: string; content: React.ReactNode }
export interface SendResult { ok: boolean; ref?: string; again?: boolean; error?: string; message?: string; name?: string }

const TURNSTILE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

/** Server error codes → the field to send people back to. */
const FIELD_OF: Record<string, string> = {
  invalid_phone: 'phone', invalid_whatsapp: 'whatsapp', invalid_name: 'full_name', bad_email: 'email', bad_date: 'birth_d', under_18: 'birth_d',
  age_out_of_range: 'birth_d', bad_instagram: 'instagram', bad_url: 'samples', cv_too_big: 'cv', cv_not_pdf: 'cv', no_consent: 'consent',
};

function ageOn(y: number, m: number, d: number) {
  const t = new Date(Date.now() + 19_800_000);
  const ty = t.getUTCFullYear(), tm = t.getUTCMonth() + 1, td = t.getUTCDate();
  return ty - y - (tm < m || (tm === m && td < d) ? 1 : 0);
}

/** Checks one step's fields: native rules plus the form's own (groups, "Other" text, date of birth, links). */
function checkStep(step: HTMLElement): boolean {
  const els = Array.from(step.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'));
  for (const el of els) el.setCustomValidity('');
  // a group that needs at least one tick
  for (const g of Array.from(step.querySelectorAll<HTMLFieldSetElement>('fieldset[data-min]'))) {
    const boxes = Array.from(g.querySelectorAll<HTMLInputElement>('input[type=checkbox], input[type=radio]'));
    if (boxes.length && !boxes.some((b) => b.checked)) boxes[0]!.setCustomValidity(g.dataset.msg ?? 'Please choose at least one.');
  }
  // "Other" ticked → its text box must say what
  for (const t of Array.from(step.querySelectorAll<HTMLInputElement>('input[data-other-for]'))) {
    const box = step.querySelector<HTMLInputElement>(`input[name="${t.dataset.otherFor}"][value="${t.dataset.otherValue}"]`);
    t.required = Boolean(box?.checked);
    if (box?.checked && !t.value.trim()) t.setCustomValidity('Please tell us what “Other” is.');
  }
  // date of birth from three selects: a real date, 18+, and the job's age limit if it has one
  for (const g of Array.from(step.querySelectorAll<HTMLElement>('[data-dob]'))) {
    const [d, m, y] = (['birth_d', 'birth_m', 'birth_y'] as const).map((n) => g.querySelector<HTMLSelectElement>(`select[name="${n}"]`)!);
    const dd = Number(d!.value), mm = Number(m!.value), yy = Number(y!.value);
    if (dd && mm && yy) {
      const real = new Date(Date.UTC(yy, mm - 1, dd)).getUTCDate() === dd;
      const age = ageOn(yy, mm, dd);
      const min = Number(g.dataset.ageMin || 18), max = Number(g.dataset.ageMax || 0);
      if (!real) d!.setCustomValidity('That date doesn’t exist. Please check the day.');
      else if (age < 18) d!.setCustomValidity('You need to be 18 or older to apply.');
      else if (age < min || (max && age > max)) d!.setCustomValidity(g.dataset.ageMsg ?? `This role is for ages ${min} to ${max}.`);
    }
  }
  // links: tidy them (add https://) and make sure at least one is there when asked
  for (const g of Array.from(step.querySelectorAll<HTMLElement>('[data-links]'))) {
    const inputs = Array.from(g.querySelectorAll<HTMLInputElement>('input'));
    for (const i of inputs) { const v = i.value.trim(); if (v && !/^https?:\/\//i.test(v)) i.value = `https://${v}`; }
    if (g.dataset.required && !inputs.some((i) => i.value.trim())) inputs[0]?.setCustomValidity('Please add at least one link to your work.');
    for (const i of inputs) if (i.value.trim() && !/^https?:\/\/[^\s<>"']+\.[^\s<>"']+$/i.test(i.value.trim())) i.setCustomValidity('That doesn’t look like a web address.');
  }
  for (const el of els) {
    if (el.offsetParent === null && !(el instanceof HTMLSelectElement)) continue;   // a field CSS has hidden (e.g. WhatsApp when "Yes")
    if (!el.checkValidity()) { el.reportValidity(); el.focus({ preventScroll: false }); return false; }
  }
  return true;
}

export function StepForm({ action, steps, submitLabel, sendingLabel = 'Sending…', hidden, send, renderSuccess, multipart = false, className }: {
  action: string; steps: Step[]; submitLabel: React.ReactNode; sendingLabel?: string; hidden: Record<string, string>;
  send: (fd: FormData) => Promise<SendResult>; renderSuccess: (r: SendResult, reset: () => void) => React.ReactNode; multipart?: boolean; className?: string;
}) {
  const id = useId();
  const [enhanced, setEnhanced] = useState(false);
  const [at, setAt] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'error' | 'done'>('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<SendResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const last = steps.length - 1;

  useEffect(() => { setEnhanced(true); }, []);
  useEffect(() => {
    if (!TURNSTILE || document.querySelector('script[data-turnstile]')) return;
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true; s.defer = true; s.dataset.turnstile = '1';
    document.head.appendChild(s);
  }, []);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  function go(to: number) {
    setAt(to); setMessage(''); if (state === 'error') setState('idle');
    requestAnimationFrame(() => { scrollTop(); stepRefs.current[to]?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea')?.focus({ preventScroll: true }); });
  }
  function next() { const el = stepRefs.current[at]; if (el && checkStep(el)) go(at + 1); }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'sending') return;
    for (let i = 0; i <= last; i++) {
      const el = stepRefs.current[i];
      if (el && !checkStep(el)) { if (i !== at) { setAt(i); requestAnimationFrame(() => { const el2 = stepRefs.current[i]; if (el2) checkStep(el2); }); } return; }
    }
    const fd = new FormData(e.currentTarget);
    setState('sending'); setMessage('');
    let r: SendResult;
    try { r = await send(fd); } catch { r = { ok: false, message: 'That didn’t send. Check your connection and try again, or message us on WhatsApp. Nothing you typed is lost.' }; }
    if (r.ok) { setResult(r); setState('done'); requestAnimationFrame(scrollTop); return; }
    setState('error'); setMessage(r.message ?? 'That didn’t send. Please try again, or message us on WhatsApp.');
    const field = r.error ? FIELD_OF[r.error] : undefined;
    if (field) {
      const i = stepRefs.current.findIndex((s) => s?.querySelector(`[name="${field}"]`));
      if (i >= 0 && i !== at) setAt(i);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus());
    }
  }

  function reset() {
    formRef.current?.reset(); setResult(null); setState('idle'); setMessage(''); setAt(0);
    requestAnimationFrame(scrollTop);
  }

  if (state === 'done' && result) return <div ref={topRef} className="scroll-mt-28">{renderSuccess(result, reset)}</div>;

  const pct = Math.round(((at + 1) / steps.length) * 100);
  return (
    <div ref={topRef} className={`scroll-mt-28 ${className ?? ''}`}>
      {enhanced ? (
        <div className="mb-6" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="font-semibold text-ink">Step {at + 1} of {steps.length}: {steps[at]!.title}</p>
            <p className="text-ink-3">{pct}%</p>
          </div>
          <ol className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Progress">
            {steps.map((s, i) => (
              <li key={s.id}>
                <button type="button" disabled={i > at} onClick={() => i < at && go(i)} aria-current={i === at ? 'step' : undefined}
                  className="group block w-full text-left disabled:cursor-default">
                  <span className={`block h-1.5 rounded-full transition-colors duration-300 ${i <= at ? 'bg-coral' : 'bg-line'}`} />
                  <span className={`mt-1.5 hidden text-xs sm:block ${i === at ? 'font-semibold text-ink' : i < at ? 'text-ink-2 group-hover:underline' : 'text-ink-3'}`}>{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <form ref={formRef} action={action} method="post" encType={multipart ? 'multipart/form-data' : undefined} onSubmit={onSubmit} noValidate={enhanced}>
        {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
          <label htmlFor={`${id}-website`}>Leave this empty</label><input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
        </div>
        {steps.map((s, i) => (
          <section key={s.id} ref={(el) => { stepRefs.current[i] = el; }} hidden={enhanced && i !== at} aria-labelledby={`${id}-${s.id}`}
            className={enhanced ? 'apply-step' : 'mb-10'}>
            <h3 id={`${id}-${s.id}`} className={enhanced ? 'sr-only' : 'mb-4 font-display text-2xl text-ink'}>{s.title}</h3>
            {s.hint ? <p className="mb-5 text-sm text-ink-3">{s.hint}</p> : null}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 [&>*]:min-w-0">{s.content}</div>
            {i === last && TURNSTILE ? <div className="cf-turnstile mt-5" data-sitekey={TURNSTILE} /> : null}
          </section>
        ))}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          {enhanced && at > 0 ? (
            <button type="button" onClick={() => go(at - 1)} className="btn btn-secondary btn-lg"><ArrowLeft className="size-4" aria-hidden />Back</button>
          ) : <span />}
          {enhanced && at < last ? (
            <button type="button" onClick={next} className="btn btn-primary btn-lg">Next<ArrowRight className="size-4" aria-hidden /></button>
          ) : (
            <button type="submit" disabled={state === 'sending'} className="btn btn-primary btn-lg">
              {state === 'sending' ? <><Loader2 className="size-4 animate-spin" aria-hidden />{sendingLabel}</> : submitLabel}
            </button>
          )}
        </div>
        <p role="alert" aria-live="assertive" className="mt-3 text-sm text-critical">{state === 'error' ? message : ''}</p>
      </form>
      <style>{`.apply-step{animation:apply-in .32s cubic-bezier(.2,.7,.2,1) both}@keyframes apply-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.apply-step{animation:none}}`}</style>
    </div>
  );
}
