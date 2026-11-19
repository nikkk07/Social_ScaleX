'use client';
// Form fields shared by the creator and careers forms. All of them work without JavaScript (CSS :has() reveals the
// "Other" and WhatsApp boxes); with JavaScript they add live clean-up, "Add another" and friendly checks.
import React, { useId, useState } from 'react';
import { Plus, X } from 'lucide-react';

const label = 'mb-1.5 block text-sm font-semibold text-ink';
const optional = <span className="font-normal text-ink-3"> (optional)</span>;
export const chip = 'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-sm transition-colors hover:border-line-strong has-[:checked]:border-ink has-[:checked]:bg-paper-2 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral/40';

export function Field({ id, title, hint, opt, wide, children }: { id: string; title: React.ReactNode; hint?: React.ReactNode; opt?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <label className={label} htmlFor={id}>{title}{opt ? optional : null}</label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-ink-3">{hint}</p> : null}
    </div>
  );
}

/** Keeps the last 10 digits of an Indian mobile as people type or paste ("+91 98765-43210" → "9876543210"). */
export function cleanMobile(v: string): string {
  let d = v.replace(/\D/g, '');
  if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
  else if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

function Mobile({ id, name, required, ...rest }: { id: string; name: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex items-stretch overflow-hidden min-h-12 rounded-[var(--radius-field)] border border-line-strong bg-surface hover:border-ink-3 focus-within:border-ink focus-within:shadow-[0_0_0_3px_var(--color-coral-tint)]">
      <span className="grid place-items-center border-r border-line bg-paper-2 px-3 text-sm font-medium text-ink-2" aria-hidden>+91</span>
      <input id={id} name={name} type="tel" inputMode="numeric" autoComplete={name === 'phone' ? 'tel-national' : 'off'} required={required}
        pattern="[6-9][0-9]{9}" maxLength={14} placeholder="98765 43210" title="10-digit Indian mobile number"
        onInput={(e) => { const t = e.currentTarget; t.value = cleanMobile(t.value); t.setCustomValidity(''); }}
        onBlur={(e) => { const t = e.currentTarget; if (t.value && !/^[6-9]\d{9}$/.test(t.value)) t.setCustomValidity('Enter a 10-digit mobile number starting with 6, 7, 8 or 9.'); }}
        className="min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-ink outline-none placeholder:text-ink-3" {...rest} />
    </div>
  );
}

/** Mobile number, "Is it on WhatsApp?", and a WhatsApp number only when the answer is No. */
export function PhoneFields() {
  const id = useId();
  const [no, setNo] = useState(false);
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2 [&:has(input[value=yes]:checked)_.wa-number]:hidden">
      <div>
        <label className={label} htmlFor={`${id}-phone`}>Mobile number</label>
        <Mobile id={`${id}-phone`} name="phone" required aria-describedby={`${id}-phone-hint`} />
        <p id={`${id}-phone-hint`} className="mt-1.5 text-xs text-ink-3">10 digits, without +91 or 0.</p>
      </div>
      <fieldset className="min-w-0">
        <legend className={label}>Is this number on WhatsApp?</legend>
        <div className="flex gap-2">
          <label className={chip}><input type="radio" name="whatsapp_same" value="yes" defaultChecked onChange={() => setNo(false)} className="size-4 accent-[#C23A22]" />Yes</label>
          <label className={chip}><input type="radio" name="whatsapp_same" value="no" onChange={() => setNo(true)} className="size-4 accent-[#C23A22]" />No</label>
        </div>
      </fieldset>
      <div className="wa-number min-w-0 sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
        <label className={label} htmlFor={`${id}-wa`}>WhatsApp number</label>
        <Mobile id={`${id}-wa`} name="whatsapp" required={no} />
        <p className="mt-1.5 text-xs text-ink-3">We send updates on WhatsApp, so please give a number that has it.</p>
      </div>
    </div>
  );
}

/** Checkbox or radio chips; an "Other" option reveals a text box for the answer. */
export function Chips({ legend, name, options, type = 'checkbox', min, otherName, otherValue = 'Other', otherPlaceholder, opt, msg }: {
  legend: string; name: string; options: [string, string][]; type?: 'checkbox' | 'radio'; min?: number; otherName?: string; otherValue?: string;
  otherPlaceholder?: string; opt?: boolean; msg?: string;
}) {
  const id = useId();
  return (
    <fieldset className="min-w-0 sm:col-span-2" data-min={min || undefined} data-msg={msg}>
      <legend className={label}>{legend}{opt ? optional : null}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, l]) => (
          <label key={v} className={chip}><input type={type} name={name} value={v} className="size-4 accent-[#C23A22]" />{l}</label>
        ))}
      </div>
      {otherName ? (
        <OtherBox id={`${id}-other`} name={otherName} forName={name} forValue={otherValue} placeholder={otherPlaceholder} />
      ) : null}
    </fieldset>
  );
}

function OtherBox({ id, name, forName, forValue, placeholder }: { id: string; name: string; forName: string; forValue: string; placeholder?: string }) {
  return (
    <div className="mt-3 hidden max-w-md [fieldset:has(input[value=Other]:checked)_&]:block [fieldset:has(input[value=other]:checked)_&]:block">
      <label className="sr-only" htmlFor={id}>Please specify</label>
      <input id={id} name={name} maxLength={80} placeholder={placeholder ?? 'Please specify'} data-other-for={forName} data-other-value={forValue} className="field" />
    </div>
  );
}

/** Date of birth as Day / Month / Year (clearer on phones than a date picker, and no "today" placeholder). */
export function Dob({ ageMin, ageMax, ageMsg }: { ageMin?: number | null; ageMax?: number | null; ageMsg?: string }) {
  const id = useId();
  const t = new Date(Date.now() + 19_800_000);
  const newest = t.getUTCFullYear() - 18, oldest = t.getUTCFullYear() - 75;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sel = 'field min-w-0 !pl-3 !pr-7 [background-position:right_0.5rem_center]';
  return (
    <fieldset className="min-w-0" data-dob data-age-min={ageMin ?? 18} data-age-max={ageMax ?? ''} data-age-msg={ageMsg}>
      <legend className={label}>Date of birth <span className="font-normal text-ink-3">(18+ only)</span></legend>
      <div className="grid grid-cols-[1fr_1.2fr_1.4fr] gap-2">
        <label className="sr-only" htmlFor={`${id}-d`}>Day</label>
        <select id={`${id}-d`} name="birth_d" required defaultValue="" className={sel} autoComplete="bday-day"><option value="" disabled>DD</option>{Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
        <label className="sr-only" htmlFor={`${id}-m`}>Month</label>
        <select id={`${id}-m`} name="birth_m" required defaultValue="" className={sel} autoComplete="bday-month"><option value="" disabled>MM</option>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select>
        <label className="sr-only" htmlFor={`${id}-y`}>Year</label>
        <select id={`${id}-y`} name="birth_y" required defaultValue="" className={sel} autoComplete="bday-year"><option value="" disabled>YYYY</option>{Array.from({ length: newest - oldest + 1 }, (_, i) => newest - i).map((y) => <option key={y} value={y}>{y}</option>)}</select>
      </div>
    </fieldset>
  );
}

/** One link box plus "Add another" (up to `max`). Without JavaScript: three boxes. */
export function Links({ name, max = 10, required, legend, hint, placeholder }: { name: string; max?: number; required?: boolean; legend: string; hint: string; placeholder: string }) {
  const id = useId();
  const [rows, setRows] = useState<number[]>([0]);
  const [seq, setSeq] = useState(1);
  return (
    <fieldset className="min-w-0 sm:col-span-2" data-links data-required={required ? '1' : undefined}>
      <legend className={label}>{legend}</legend>
      <div className="grid gap-2">
        {rows.map((r, i) => (
          <div key={r} className="flex gap-2">
            <label className="sr-only" htmlFor={`${id}-${r}`}>Link {i + 1}</label>
            <input id={`${id}-${r}`} name={name} type="url" inputMode="url" maxLength={300} placeholder={i === 0 ? placeholder : 'Another link'} className="field min-w-0 flex-1"
              autoFocus={i > 0 && i === rows.length - 1} />
            {rows.length > 1 ? (
              <button type="button" onClick={() => setRows(rows.filter((x) => x !== r))} className="grid size-12 shrink-0 place-items-center rounded-full border border-line-strong text-ink-2 hover:bg-paper-2" aria-label={`Remove link ${i + 1}`}>
                <X className="size-4" aria-hidden /></button>
            ) : null}
          </div>
        ))}
        <noscript>{[1, 2].map((n) => <input key={n} name={name} type="url" maxLength={300} placeholder="Another link (optional)" className="field" aria-label={`Link ${n + 1}`} />)}</noscript>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-3">{hint}</p>
        {rows.length < max ? (
          <button type="button" onClick={() => { setRows([...rows, seq]); setSeq(seq + 1); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-coral-text hover:bg-paper-2">
            <Plus className="size-4" aria-hidden />Add another</button>
        ) : <p className="text-xs text-ink-3">That’s the maximum of {max}.</p>}
      </div>
    </fieldset>
  );
}

export function Select({ id, name, title, options, opt, required, placeholder = 'Choose…' }: { id: string; name: string; title: string; options: [string, string][]; opt?: boolean; required?: boolean; placeholder?: string }) {
  return (
    <Field id={id} title={title} opt={opt}>
      <select id={id} name={name} required={required} defaultValue="" className="field"><option value="" disabled={required}>{placeholder}</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
    </Field>
  );
}

export function Consent({ text }: { text: string }) {
  return (
    <label className="flex items-start gap-3 text-sm text-ink-2 sm:col-span-2">
      <input type="checkbox" name="consent" required className="mt-0.5 size-5 shrink-0 accent-[#C23A22]" />
      <span>{text} See our <a href="/privacy" className="underline" target="_blank">privacy policy</a>.</span>
    </label>
  );
}
