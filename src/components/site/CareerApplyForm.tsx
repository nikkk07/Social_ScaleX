'use client';
// The job application, in 3 steps: About you → Education & experience → CV. For one opening (opening = its slug) or
// the open "send your profile" form. Posts multipart to the CRM (a CV PDF may ride along); works with JavaScript off
// (the CRM redirects to /careers/thanks). With JavaScript it checks each step, sends with fetch and answers in place.
import React, { useId, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { AVAILABLE, CAREERS_CONSENT, CAREERS_INTAKE, CV_MAX_MB, EXPERIENCE, JOB_LANGUAGES, QUALIFICATIONS } from '@/lib/careers';
import { HEARD_FROM } from '@/lib/creators';
import { trackJobApply } from '@/lib/track';
import { StepForm, type SendResult } from './apply/StepForm';
import { Chips, Consent, Dob, Field, PhoneFields, Select } from './apply/fields';
import { Success } from './apply/Success';

const pad = (n: string) => n.padStart(2, '0');

function CvField() {
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  return (
    <div className="grid gap-4 sm:col-span-2">
      <div>
        <p className="mb-1.5 block text-sm font-semibold text-ink">CV <span className="font-normal text-ink-3">(optional: a PDF or a link)</span></p>
        <label htmlFor={`${id}-cv`} className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-line-strong bg-paper px-4 py-5 text-center hover:border-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-coral/40">
          <FileText className="size-6 text-ink-3" aria-hidden />
          <span className="text-sm font-semibold text-ink">{file ? file.name : 'Choose your CV (PDF)'}</span>
          <span className="text-xs text-ink-3">{file ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `PDF only, up to ${CV_MAX_MB} MB`}</span>
          <input id={`${id}-cv`} name="cv" type="file" accept="application/pdf,.pdf" className="sr-only"
            onChange={(e) => {
              const t = e.currentTarget; const f = t.files?.[0] ?? null; t.setCustomValidity(''); setErr('');
              if (f && !/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { setErr('Please choose a PDF file, or paste a link below.'); t.value = ''; setFile(null); return; }
              if (f && f.size > CV_MAX_MB * 1024 * 1024) { setErr(`That file is over ${CV_MAX_MB} MB. Please choose a smaller PDF, or paste a link below.`); t.value = ''; setFile(null); return; }
              setFile(f);
            }} />
        </label>
        {file ? <button type="button" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-2 hover:text-ink"
          onClick={(e) => { const inp = (e.currentTarget.parentElement?.querySelector('input[type=file]') as HTMLInputElement | null); if (inp) inp.value = ''; setFile(null); }}>
          <X className="size-4" aria-hidden />Remove file</button> : null}
        <p role="alert" className="mt-1.5 text-sm text-critical">{err}</p>
      </div>
      <Field id={`${id}-link`} title="Or a link to your CV" opt hint="Google Drive, LinkedIn or any public link.">
        <input id={`${id}-link`} name="cv_link" type="url" inputMode="url" maxLength={300} placeholder="https://drive.google.com/…" className="field" /></Field>
    </div>
  );
}

export function CareerApplyForm({ opening, openingTitle, ageMin, ageMax, returnUrl }: { opening?: string; openingTitle?: string; ageMin?: number | null; ageMax?: number | null; returnUrl: string }) {
  const id = useId();
  const f = (n: string) => `${id}-${n}`;

  async function send(fd: FormData): Promise<SendResult> {
    const y = String(fd.get('birth_y') ?? ''), m = String(fd.get('birth_m') ?? ''), d = String(fd.get('birth_d') ?? '');
    if (y && m && d) fd.set('birth_date', `${y}-${pad(m)}-${pad(d)}`);
    const cv = fd.get('cv');
    if (cv instanceof File && cv.size === 0) fd.delete('cv');
    const r = await fetch(CAREERS_INTAKE, { method: 'POST', headers: { accept: 'application/json' }, body: fd });
    const j = (await r.json().catch(() => ({ ok: false, message: r.status === 413 ? `Your CV is larger than ${CV_MAX_MB} MB. Please upload a smaller PDF, or paste a link instead.` : undefined }))) as SendResult;
    if (j.ok) trackJobApply(opening ? 'opening' : 'profile');
    return j.ok ? { ok: true, ref: j.ref, again: j.again, name: String(fd.get('full_name') ?? '').trim().split(/\s+/)[0] } : { ok: false, error: j.error, message: j.message };
  }

  const steps = [
    {
      id: 'you', title: 'About you', hint: 'So we know who you are and how to reach you.',
      content: (<>
        <Field id={f('name')} title="Full name"><input id={f('name')} name="full_name" required minLength={2} maxLength={120} autoComplete="name" className="field" /></Field>
        <Field id={f('email')} title="E-mail" opt hint="For your confirmation."><input id={f('email')} name="email" type="email" autoComplete="email" maxLength={200} className="field" /></Field>
        <PhoneFields />
        <Dob ageMin={ageMin} ageMax={ageMax} ageMsg={ageMax ? `This role is for ages ${ageMin ?? 18} to ${ageMax}. You can still send your profile from the Careers page.` : undefined} />
        <Field id={f('city')} title="City / area you live in"><input id={f('city')} name="city" required maxLength={80} autoComplete="address-level2" className="field" placeholder="e.g. Shalimar Bagh, Delhi" /></Field>
        {opening ? null : <Field id={f('role')} title="Role you’re looking for" wide><input id={f('role')} name="role_wanted" required maxLength={80} className="field" placeholder="e.g. Video editor, Receptionist, Sales" /></Field>}
      </>),
    },
    {
      id: 'exp', title: 'Education & experience', hint: 'Freshers are welcome: choose “Fresher”.',
      content: (<>
        <Chips legend="Highest education" name="qualification" type="radio" options={QUALIFICATIONS} min={1} msg="Please choose your education." />
        <Chips legend="Work experience" name="experience" type="radio" options={EXPERIENCE} min={1} msg="Please choose your experience." />
        <Chips legend="Languages you speak well" name="languages" options={JOB_LANGUAGES.map((l) => [l, l])} min={1} otherName="other_language" otherPlaceholder="Which language?" msg="Please tick at least one language." />
        <Field id={f('skills')} title="Your skills" opt wide hint="Separate with commas.">
          <input id={f('skills')} name="skills" maxLength={400} className="field" placeholder="e.g. MS Excel, typing, customer service, Canva" /></Field>
        <Select id={f('avail')} name="available" title="When can you join?" required options={AVAILABLE} />
        <Field id={f('sal')} title="Expected salary (₹ a month)" opt>
          <input id={f('sal')} name="expected_salary" inputMode="numeric" pattern="[0-9]*" maxLength={8} className="field" placeholder="e.g. 15000"
            onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').replace(/^0+(?=\d)/, ''); }} /></Field>
      </>),
    },
    {
      id: 'cv', title: 'CV and finish', hint: 'Almost done. A CV helps, but you can apply without one.',
      content: (<>
        <CvField />
        <Field id={f('about')} title={opening ? 'Why you’d be great at this job' : 'Tell us about yourself'} opt wide>
          <textarea id={f('about')} name="about" maxLength={1500} rows={4} className="field" /></Field>
        <Select id={f('heard')} name="heard_from" title="How did you hear about us?" opt options={HEARD_FROM.map((h) => [h, h])} />
        <Consent text={CAREERS_CONSENT} />
      </>),
    },
  ];

  return (
    <StepForm action={CAREERS_INTAKE} multipart steps={steps} hidden={{ opening: opening ?? '', return: returnUrl }}
      submitLabel={opening ? 'Apply to Social ScaleX' : 'Send my profile to Social ScaleX'} sendingLabel="Sending your application…" send={send}
      renderSuccess={(r, reset) => (
        <Success
          title={r.again ? `Updated, ${r.name ?? 'there'}!` : `Applied successfully, ${r.name ?? 'there'}!`}
          lede={r.again ? 'We already had your application, so we’ve updated it with these details.'
            : `Your application${openingTitle ? ` for ${openingTitle}` : ''} has reached the Social ScaleX team. Here’s what happens next.`}
          reference={r.ref}
          steps={[
            { title: 'We read it', text: 'A real person on our team reviews every application.' },
            { title: 'We call you', text: openingTitle ? 'If you’re shortlisted, we call or WhatsApp you to fix an interview.' : 'When a matching role opens, you hear from us first.' },
            { title: 'Interview', text: 'A short interview with the employer. Never any fee, at any step.' },
          ]}
          againLabel={opening ? 'See other jobs and send your profile' : 'Send another application'} {...(opening ? { againHref: '/careers#profile' } : { onAgain: reset })}
          footnote="If you gave an e-mail, a confirmation is on its way. Keep your phone handy: we usually call or WhatsApp."
        />
      )}
    />
  );
}
