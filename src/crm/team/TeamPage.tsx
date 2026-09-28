'use client';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as DM from '@radix-ui/react-dropdown-menu';
import { Eye, EyeOff, KeyRound, MoreHorizontal, Pencil, Power, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AppRole, Profile } from '@/lib/database.types';
import { formatPhone, isPhoneOnlyEmail, normalizePhone, passwordProblem, isEmail } from '@/lib/crm/normalize';
import { useMe } from '../auth/AuthProvider';
import { Badge, Card, ErrorState, Field, PageHeader, Spinner, inputClass } from '../ui/kit';
import { Btn, Modal } from '../ui/Modal';
import { apiFetch, rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { ROLE_LABEL } from '../lib/labels';
import { formatDateOnly, relative } from '../lib/time';
import { invalidateCrm } from '../data/hooks';
import { cn } from '@/components/ui/utils';

type Staff = Profile & { open_leads: number };

function useStaff() {
  return useQuery({
    queryKey: ['staff'],
    queryFn: async (): Promise<Staff[]> => {
      const [p, l] = await Promise.all([
        supabase.from('profiles').select('*').order('is_active', { ascending: false }).order('full_name'),
        supabase.from('leads').select('owner_id').is('deleted_at', null).in('stage', ['new', 'attempting']).not('owner_id', 'is', null).limit(10000),
      ]);
      if (p.error) throw new Error(p.error.message);
      const counts = new Map<string, number>();
      for (const r of l.data ?? []) if (r.owner_id) counts.set(r.owner_id, (counts.get(r.owner_id) ?? 0) + 1);
      return (p.data ?? []).map((x) => ({ ...x, open_leads: counts.get(x.id) ?? 0 }));
    },
  });
}

function canManage(actor: AppRole, target: AppRole): boolean {
  return actor === 'owner' || (actor === 'admin' && target === 'member');
}

export function TeamPage() {
  const { id: me, role } = useMe();
  const qc = useQueryClient();
  const staff = useStaff();
  const [edit, setEdit] = useState<Staff | 'new' | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'deactivate' | 'reactivate' | 'delete'; s: Staff } | null>(null);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ['staff'] }); void qc.invalidateQueries({ queryKey: ['profiles'] }); invalidateCrm(qc); };

  async function topUp(s: Staff) {
    try {
      const n = await rpc('top_up_leads', { p_member: s.id });
      toast.success(n ? `${n} lead${n === 1 ? '' : 's'} assigned to ${s.full_name ?? 'member'}.` : 'Already at quota, or the pool is empty.');
      refresh();
    } catch (e) {
      toast.error(friendlyError(e));
    }
  }

  async function runConfirm() {
    if (!confirm) return;
    try {
      if (confirm.kind === 'delete') {
        await apiFetch(`/api/crm/users/${confirm.s.id}`, { method: 'DELETE' });
        toast.success('Account deleted. Their leads went back to the pool.');
      } else {
        await apiFetch(`/api/crm/users/${confirm.s.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: confirm.kind === 'reactivate' }) });
        toast.success(confirm.kind === 'reactivate' ? 'Account reactivated.' : 'Account deactivated. Their open leads went back to the pool.');
      }
      setConfirm(null);
      refresh();
    } catch (e) {
      toast.error(friendlyError(e));
    }
  }

  return (
    <>
      <PageHeader title="Team" description="Who can sign in, their role, and how many fresh leads members get each day."
        actions={<Btn onClick={() => setEdit('new')}><UserPlus aria-hidden="true" /> Add member</Btn>} />
      <Card>
        {staff.isLoading ? <Spinner /> : staff.isError ? <ErrorState message={friendlyError(staff.error)} onRetry={() => void staff.refetch()} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Team members</caption>
              <thead className="border-b border-border text-left text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Name</th>
                  <th scope="col" className="px-4 py-2 font-medium">Sign-in</th>
                  <th scope="col" className="px-4 py-2 font-medium">Role</th>
                  <th scope="col" className="px-4 py-2 font-medium">Daily quota</th>
                  <th scope="col" className="px-4 py-2 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(staff.data ?? []).map((s) => {
                  const manage = s.id !== me && canManage(role, s.role);
                  return (
                    <tr key={s.id} className={cn(!s.is_active && 'opacity-60')}>
                      <th scope="row" className="px-4 py-3 text-left font-medium">
                        {s.full_name || '—'}{s.id === me ? <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span> : null}
                      </th>
                      <td className="px-4 py-3 text-muted-foreground">
                        {!isPhoneOnlyEmail(s.email) && s.email ? <div>{s.email}</div> : null}
                        {s.phone ? <div className="tabular">{formatPhone(s.phone)}</div> : null}
                      </td>
                      <td className="px-4 py-3"><Badge tone={s.role === 'owner' ? 'violet' : s.role === 'admin' ? 'info' : 'neutral'}>{ROLE_LABEL[s.role]}</Badge></td>
                      <td className="px-4 py-3 tabular">
                        {s.role === 'member' ? (
                          <>
                            {s.daily_lead_quota ?? 'Not set'}
                            <span className="block text-xs text-muted-foreground">{s.open_leads} fresh in hand{s.last_top_up_on ? ` · topped up ${formatDateOnly(s.last_top_up_on)}` : ''}</span>
                          </>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">{s.is_active ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Deactivated</Badge>}
                        <span className="block text-xs text-muted-foreground">Added {relative(s.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {manage ? (
                          <DM.Root>
                            <DM.Trigger asChild>
                              <button type="button" className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted" aria-label={`Actions for ${s.full_name ?? 'member'}`}>
                                <MoreHorizontal className="size-4" aria-hidden="true" />
                              </button>
                            </DM.Trigger>
                            <DM.Portal>
                              <DM.Content align="end" sideOffset={4} className="z-50 min-w-48 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg">
                                <Item onSelect={() => setEdit(s)} icon={<Pencil />}>Edit / reset password</Item>
                                {s.role === 'member' && s.is_active ? <Item onSelect={() => void topUp(s)} icon={<RefreshCw />}>Top up leads now</Item> : null}
                                <Item onSelect={() => setConfirm({ kind: s.is_active ? 'deactivate' : 'reactivate', s })} icon={<Power />}>{s.is_active ? 'Deactivate' : 'Reactivate'}</Item>
                                {role === 'owner' ? <Item onSelect={() => setConfirm({ kind: 'delete', s })} icon={<Trash2 />} danger>Delete permanently</Item> : null}
                              </DM.Content>
                            </DM.Portal>
                          </DM.Root>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted-foreground">
        Deactivating is instant and keeps all history; use it when someone leaves. Only owners can delete an account.
      </p>

      {edit ? <UserDialog target={edit === 'new' ? null : edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); refresh(); }} /> : null}
      {confirm ? (
        <Modal open size="sm" onOpenChange={(o) => { if (!o) setConfirm(null); }}
          title={confirm.kind === 'delete' ? `Delete ${confirm.s.full_name ?? 'this account'}?` : confirm.kind === 'deactivate' ? `Deactivate ${confirm.s.full_name ?? 'this account'}?` : `Reactivate ${confirm.s.full_name ?? 'this account'}?`}
          description={confirm.kind === 'delete' ? 'They can never sign in again. Their leads return to the pool; history keeps the text but not the link to them.'
            : confirm.kind === 'deactivate' ? 'They are signed out within minutes and can’t sign back in. Their open leads return to the pool.'
              : 'They can sign in again with their existing password.'}
          footer={<><Btn variant="secondary" onClick={() => setConfirm(null)}>Cancel</Btn>
            <Btn variant={confirm.kind === 'reactivate' ? 'primary' : 'danger'} onClick={() => void runConfirm()}>
              {confirm.kind === 'delete' ? 'Delete' : confirm.kind === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </Btn></>}>
          <span className="sr-only">Confirm</span>
        </Modal>
      ) : null}
    </>
  );
}

function Item({ children, icon, onSelect, danger }: { children: React.ReactNode; icon: React.ReactNode; onSelect: () => void; danger?: boolean }) {
  return (
    <DM.Item onSelect={onSelect} className={cn('flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 outline-none data-[highlighted]:bg-muted [&_svg]:size-4', danger && 'text-destructive')}>
      <span aria-hidden="true">{icon}</span>{children}
    </DM.Item>
  );
}

function UserDialog({ target, onClose, onSaved }: { target: Staff | null; onClose: () => void; onSaved: () => void }) {
  const { role: myRole } = useMe();
  const isNew = !target;
  const [name, setName] = useState(target?.full_name ?? '');
  const [email, setEmail] = useState(target && !isPhoneOnlyEmail(target.email) ? target.email : '');
  const [phone, setPhone] = useState(target?.phone ? formatPhone(target.phone) : '');
  const [role, setRole] = useState<AppRole>(target?.role ?? 'member');
  const [quota, setQuota] = useState(target?.daily_lead_quota != null ? String(target.daily_lead_quota) : isNew ? '10' : '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const roles: AppRole[] = myRole === 'owner' ? ['member', 'admin', 'owner'] : ['member'];

  function genPassword() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const bytes = new Uint32Array(12);
    crypto.getRandomValues(bytes);
    let p = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
    if (!/\d/.test(p)) p = p.slice(0, -1) + '7';
    setPassword(p);
    setShowPw(true);
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    const er: Record<string, string> = {};
    if (name.trim().length < 2) er.name = 'Enter the full name.';
    if (email.trim() && !isEmail(email)) er.email = 'Enter a valid email.';
    if (phone.trim() && !normalizePhone(phone)) er.phone = 'Enter a valid mobile number.';
    if (!email.trim() && !phone.trim()) er.email = 'Add an email or a phone number to sign in with.';
    if (isNew || password) { const p = passwordProblem(password); if (p) er.password = p; }
    const qn = quota.trim() === '' ? null : Number(quota);
    if (role === 'member' && qn !== null && (!Number.isInteger(qn) || qn < 0 || qn > 500)) er.quota = 'Use a whole number from 0 to 500.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      if (isNew) {
        await apiFetch('/api/crm/users', { method: 'POST', body: JSON.stringify({
          full_name: name.trim(), email: email.trim(), phone: phone.trim(), password, role,
          daily_lead_quota: role === 'member' ? qn : null,
        }) });
        toast.success(`Account created. Share the password with ${name.trim()} securely.`);
      } else if (target) {
        const body: Record<string, unknown> = {};
        if (name.trim() !== (target.full_name ?? '')) body.full_name = name.trim();
        const curEmail = isPhoneOnlyEmail(target.email) ? '' : target.email;
        if (email.trim().toLowerCase() !== curEmail) body.email = email.trim() || null;
        const np = phone.trim() ? normalizePhone(phone) : null;
        if (np !== target.phone) body.phone = phone.trim() || null;
        if (role !== target.role) body.role = role;
        if (role === 'member' && qn !== target.daily_lead_quota) body.daily_lead_quota = qn;
        if (password) body.password = password;
        if (Object.keys(body).length) {
          await apiFetch(`/api/crm/users/${target.id}`, { method: 'PATCH', body: JSON.stringify(body) });
          toast.success(password ? 'Saved. The new password works immediately.' : 'Saved.');
        }
      }
      onSaved();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} title={isNew ? 'Add a team member' : `Edit ${target?.full_name ?? 'member'}`}
      description="They sign in with their email or mobile number and this password. No OTP." onSubmit={save}
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Create account' : 'Save'}</Btn></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name} className="sm:col-span-2">
          {({ id, describedBy, invalid }) => <input id={id} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputClass} aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="off" />}
        </Field>
        <Field label="Email" error={errors.email}>
          {({ id, describedBy, invalid }) => <input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="off" />}
        </Field>
        <Field label="Mobile number" error={errors.phone} hint="10-digit Indian mobile, or +country code">
          {({ id, describedBy, invalid }) => <input id={id} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="off" />}
        </Field>
        <Field label="Role">
          {({ id }) => (
            <select id={id} value={role} onChange={(e) => setRole(e.target.value as AppRole)} className={inputClass} disabled={roles.length === 1}>
              {roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          )}
        </Field>
        {role === 'member' ? (
          <Field label="Daily lead quota" error={errors.quota} hint="Fresh leads topped up each morning. Empty = none.">
            {({ id, describedBy, invalid }) => <input id={id} inputMode="numeric" value={quota} onChange={(e) => setQuota(e.target.value.replace(/\D/g, ''))} className={inputClass} aria-describedby={describedBy} aria-invalid={invalid || undefined} />}
          </Field>
        ) : <div className="hidden sm:block" />}
        <Field label={isNew ? 'Password' : 'New password (leave empty to keep)'} required={isNew} error={errors.password} className="sm:col-span-2"
          hint="At least 8 characters with a letter and a number.">
          {({ id, describedBy, invalid }) => (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input id={id} type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className={cn(inputClass, 'pr-10')}
                  aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw((x) => !x)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground" aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}>
                  {showPw ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                </button>
              </div>
              <Btn variant="secondary" onClick={genPassword}><KeyRound aria-hidden="true" /> Generate</Btn>
            </div>
          )}
        </Field>
      </div>
    </Modal>
  );
}
