'use client';
// The creator application, in 3 steps: About you → Your work → Charges. A real form that posts to the CRM (works
// with JavaScript off: the CRM redirects to /creators/thanks). With JavaScript it checks each step, sends with fetch
// and celebrates in place. Nothing is stored in the browser.
import React, { useId } from 'react';
import { CONSENT_TEXT, CONTENT_TYPES, CRM_INTAKE, FOLLOWER_RANGES, HEARD_FROM, LANGUAGES, NICHES } from '@/lib/creators';
import { trackCreatorApply } from '@/lib/track';
import { StepForm, type SendResult } from './apply/StepForm';
import { Chips, Consent, Dob, Field, Links, PhoneFields, Select } from './apply/fields';
import { Success } from './apply/Success';

const many = (fd: FormData, k: string) => fd.getAll(k).map(String).map((s) => s.trim()).filter(Boolean);
const one = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const pad = (n: string) => n.padStart(2, '0');

export function CreatorApplyForm({ brief, briefTitle, returnUrl }: { brief?: string; briefTitle?: string; returnUrl: string }) {
  const id = useId();
  const f = (n: string) => `${id}-${n}`;

  async function send(fd: FormData): Promise<SendResult> {
    const y = one(fd, 'birth_y'), m = one(fd, 'birth_m'), d = one(fd, 'birth_d');
    const body = {
      brief: brief ?? '', full_name: one(fd, 'full_name'), phone: one(fd, 'phone'), whatsapp_same: one(fd, 'whatsapp_same') || 'yes', whatsapp: one(fd, 'whatsapp'),
      email: one(fd, 'email'), city: one(fd, 'city'), birth_date: y && m && d ? `${y}-${pad(m)}-${pad(d)}` : '',
      instagram: one(fd, 'instagram'), youtube: one(fd, 'youtube'), follower_range: one(fd, 'follower_range'),
      content_types: many(fd, 'content_types'), other_content: one(fd, 'other_content'), niches: many(fd, 'niches'), other_niche: one(fd, 'other_niche'),
      languages: many(fd, 'languages'), other_language: one(fd, 'other_language'), samples: [...new Set(many(fd, 'samples'))],
      rate: one(fd, 'rate'), rate_negotiable: fd.get('rate_negotiable') === 'on', rate_note: one(fd, 'rate_note'), pitch: one(fd, 'pitch'),
      heard_from: one(fd, 'heard_from'), consent: fd.get('consent') === 'on', website: one(fd, 'website'), 'cf-turnstile-response': one(fd, 'cf-turnstile-response'),
    };
    const r = await fetch(CRM_INTAKE, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = (await r.json().catch(() => ({}))) as SendResult;
    if (j.ok) trackCreatorApply(brief ? 'brief' : 'network');
    return j.ok ? { ok: true, ref: j.ref, again: j.again, name: body.full_name.split(/\s+/)[0] } : { ok: false, error: j.error, message: j.message };
  }

  const steps = [
    {
      id: 'you', title: 'About you', hint: 'So we know who you are and how to reach you.',
      content: (<>
        <Field id={f('name')} title="Full name"><input id={f('name')} name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="field" /></Field>
        <Field id={f('email')} title="E-mail" opt hint="For your confirmation."><input id={f('email')} name="email" type="email" autoComplete="email" maxLength={200} className="field" /></Field>
        <PhoneFields />
        <Dob />
        <Field id={f('city')} title="City"><input id={f('city')} name="city" required maxLength={80} autoComplete="address-level2" className="field" placeholder="e.g. Delhi" /></Field>
        <Field id={f('ig')} title="Instagram handle"><input id={f('ig')} name="instagram" required maxLength={80} placeholder="@yourhandle" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="field"
          onBlur={(e) => { const t = e.currentTarget; t.value = t.value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, ''); }} /></Field>
        <Field id={f('yt')} title="YouTube channel" opt><input id={f('yt')} name="youtube" type="url" inputMode="url" placeholder="https://youtube.com/@…" maxLength={300} className="field" /></Field>
        <Chips legend="Instagram followers" name="follower_range" type="radio" options={FOLLOWER_RANGES} min={1} msg="Please pick your follower range." />
      </>),
    },
    {
      id: 'work', title: 'Your work', hint: 'Tick everything that applies. This is how we match you to briefs.',
      content: (<>
        <Chips legend="What you make" name="content_types" options={Object.entries(CONTENT_TYPES)} min={1} otherName="other_content" otherValue="other" otherPlaceholder="What else do you make?" msg="Please tick at least one." />
        <Chips legend="Your niches" name="niches" options={NICHES.map((n) => [n, n])} min={1} otherName="other_niche" otherPlaceholder="Your niche" msg="Please tick at least one niche." />
        <Chips legend="Languages you create in" name="languages" options={LANGUAGES.map((n) => [n, n])} min={1} otherName="other_language" otherPlaceholder="Which language?" msg="Please tick at least one language." />
        <Links name="samples" required legend="Your best work" placeholder="https://www.instagram.com/reel/…"
          hint="Public links: Reels, YouTube, Google Drive or a portfolio site. Add as many as you like." />
      </>),
    },
    {
      id: 'charges', title: 'Charges', hint: brief ? 'Your quote for this brief. You can still discuss it with us.' : 'What you usually charge. You can always discuss it with us.',
      content: (<>
        <Field id={f('rate')} title={brief ? 'Expected charges for this brief (₹)' : 'Expected charges for a Reel (₹)'}>
          <input id={f('rate')} name="rate" inputMode="numeric" pattern="[0-9]*" maxLength={8} required placeholder="e.g. 2500" className="field"
            onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''); }} /></Field>
        <div className="flex items-end pb-1">
          <label className="flex min-h-11 items-center gap-3 text-sm text-ink"><input type="checkbox" name="rate_negotiable" className="size-5 accent-[#C23A22]" />My charges are negotiable</label>
        </div>
        <Field id={f('note')} title="What’s included" opt wide><input id={f('note')} name="rate_note" maxLength={200} placeholder="e.g. script, 1 revision, raw files" className="field" /></Field>
        <Field id={f('pitch')} title={brief ? 'Why you’re right for this brief' : 'Tell us about you'} opt wide>
          <textarea id={f('pitch')} name="pitch" maxLength={1500} rows={4} className="field" placeholder="Brands you’ve worked with, your style, your equipment…" /></Field>
        <Select id={f('heard')} name="heard_from" title="How did you hear about us?" opt options={HEARD_FROM.map((h) => [h, h])} />
        <Consent text={CONSENT_TEXT} />
      </>),
    },
  ];

  return (
    <StepForm action={CRM_INTAKE} steps={steps} hidden={{ brief: brief ?? '', return: returnUrl }}
      submitLabel={brief ? 'Apply with Social ScaleX' : 'Start your journey with Social ScaleX'} sendingLabel="Sending your application…" send={send}
      renderSuccess={(r, reset) => (
        <Success
          title={r.again ? `Updated, ${r.name ?? 'creator'}!` : `You’re in, ${r.name ?? 'creator'}!`}
          lede={r.again ? 'We already had your application, so we’ve updated it with these details.'
            : `Your application${briefTitle ? ` for “${briefTitle}”` : ' to the Social ScaleX creator network'} has reached our team. Here’s what happens next.`}
          reference={r.ref}
          steps={[
            { title: 'We read it', text: 'A real person on our team reviews every application.' },
            { title: 'We match you', text: brief ? 'If you’re shortlisted, we message you with the next steps.' : 'When a paid brief fits your niche, language and city, you hear first.' },
            { title: 'You create', text: 'Agree the fee in writing, make the content, get paid. Never any fee to us.' },
          ]}
          againLabel={brief ? 'See other open briefs' : 'Send another application'} {...(brief ? { againHref: '/creators#briefs' } : { onAgain: reset })}
          footnote="If you gave an e-mail, a confirmation is on its way. Save our WhatsApp number so you don’t miss our message."
        />
      )}
    />
  );
}
