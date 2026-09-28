'use client';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { formatPhone, isPhoneOnlyEmail, passwordProblem } from '@/lib/crm/normalize';
import { useAuth, useMe } from '../auth/AuthProvider';
import { useTheme, type ThemeChoice } from '../theme';
import { Card, CardHeader, Field, PageHeader, inputClass } from '../ui/kit';
import { Btn } from '../ui/Modal';
import { apiFetch } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { ROLE_LABEL } from '../lib/labels';
import { cn } from '@/components/ui/utils';

export function AccountPage() {
  const { profile, role } = useMe();
  const { refreshProfile } = useAuth();
  const { choice, setChoice } = useTheme();
  const [name, setName] = useState(profile.full_name ?? '');
  const [savingName, setSavingName] = useState(false);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) { setErrs({ name: 'Enter your full name.' }); return; }
    setErrs({});
    setSavingName(true);
    try {
      await apiFetch(`/api/crm/users/${profile.id}`, { method: 'PATCH', body: JSON.stringify({ full_name: name.trim() }) });
      await refreshProfile();
      toast.success('Name updated.');
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setSavingName(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!cur) er.cur = 'Enter your current password.';
    const p = passwordProblem(next);
    if (p) er.next = p;
    if (next !== confirm) er.confirm = 'The passwords don’t match.';
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await apiFetch('/api/crm/me/password', { method: 'POST', body: JSON.stringify({ current_password: cur, new_password: next }) });
      setCur(''); setNext(''); setConfirm('');
      toast.success('Password changed.');
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }

  const pwInput = (id: string, value: string, set: (v: string) => void, describedBy: string | undefined, invalid: boolean, auto: string) => (
    <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => set(e.target.value)} autoComplete={auto}
      className={inputClass} aria-describedby={describedBy} aria-invalid={invalid || undefined} />
  );

  return (
    <>
      <PageHeader title="My account" description={`${ROLE_LABEL[role]} · signs in with ${[!isPhoneOnlyEmail(profile.email) ? profile.email : null, profile.phone ? formatPhone(profile.phone) : null].filter(Boolean).join(' or ')}`} />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader title="Profile" description="Email, phone and role are changed by an owner or admin." />
          <form onSubmit={saveName} noValidate className="flex flex-wrap items-end gap-3 p-4">
            <Field label="Full name" error={errs.name} className="min-w-60 flex-1">
              {({ id, describedBy, invalid }) => <input id={id} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputClass} aria-describedby={describedBy} aria-invalid={invalid || undefined} />}
            </Field>
            <Btn type="submit" disabled={savingName || name.trim() === (profile.full_name ?? '')}>{savingName ? 'Saving…' : 'Save'}</Btn>
          </form>
        </Card>

        <Card>
          <CardHeader title="Password" description="At least 8 characters with a letter and a number." />
          <form onSubmit={savePassword} noValidate className="grid gap-4 p-4 sm:grid-cols-3">
            <Field label="Current password" error={errs.cur}>{({ id, describedBy, invalid }) => pwInput(id, cur, setCur, describedBy, invalid, 'current-password')}</Field>
            <Field label="New password" error={errs.next}>{({ id, describedBy, invalid }) => pwInput(id, next, setNext, describedBy, invalid, 'new-password')}</Field>
            <Field label="Repeat new password" error={errs.confirm}>{({ id, describedBy, invalid }) => pwInput(id, confirm, setConfirm, describedBy, invalid, 'new-password')}</Field>
            <div className="flex items-center justify-between gap-3 sm:col-span-3">
              <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />} {show ? 'Hide' : 'Show'} passwords
              </button>
              <Btn type="submit" disabled={busy}>{busy ? 'Changing…' : 'Change password'}</Btn>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Reminders" description="A reminder appears 15 minutes before each of your follow-ups while the CRM is open." />
          <DesktopAlerts />
        </Card>

        <Card>
          <CardHeader title="Appearance" />
          <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2 p-4">
            {(['light', 'dark', 'system'] as ThemeChoice[]).map((c) => (
              <button key={c} type="button" role="radio" aria-checked={choice === c} onClick={() => setChoice(c)}
                className={cn('rounded-lg border px-4 py-2 text-sm capitalize', choice === c ? 'border-primary bg-accent font-medium text-accent-foreground' : 'border-border hover:bg-muted')}>
                {c === 'system' ? 'Match my device' : c}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function DesktopAlerts() {
  const [perm, setPerm] = useState<NotificationPermission | 'unsupported'>('default');
  useEffect(() => {
    setPerm(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  }, []);
  if (perm === 'unsupported') return <p className="p-4 text-sm text-muted-foreground">This browser doesn’t support desktop notifications.</p>;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
      <span className="text-muted-foreground">
        {perm === 'granted' ? 'Desktop notifications are on for this browser.' : perm === 'denied' ? 'Desktop notifications are blocked. Allow them in your browser’s site settings.' : 'Also show a desktop notification when the CRM tab isn’t in front.'}
      </span>
      {perm === 'default' ? (
        <Btn variant="secondary" onClick={() => void Notification.requestPermission().then(setPerm)}>Turn on desktop notifications</Btn>
      ) : null}
    </div>
  );
}
