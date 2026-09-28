'use client';
import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { CrmSettings } from '@/lib/database.types';
import { Card, CardHeader, ErrorState, Field, PageHeader, Spinner, inputClass } from '../ui/kit';
import { Btn } from '../ui/Modal';
import { qk, useProfiles, useSettings } from '../data/hooks';
import { friendlyError } from '../lib/errors';
import { formatDateTime } from '../lib/time';

type Key = Exclude<keyof CrmSettings, 'id' | 'updated_at'>;
const FIELDS: { key: Key; label: string; hint: string; unit: string; min: number; max: number }[] = [
  { key: 'retry_no_answer_minutes', label: 'Retry after “No answer”', hint: 'Minutes until the retry call is due', unit: 'min', min: 5, max: 10080 },
  { key: 'retry_busy_minutes', label: 'Retry after “Busy”', hint: 'Minutes', unit: 'min', min: 5, max: 10080 },
  { key: 'retry_unreachable_minutes', label: 'Retry after “Switched off / Not reachable”', hint: 'Minutes (1440 = next day)', unit: 'min', min: 5, max: 10080 },
  { key: 'retry_rejected_minutes', label: 'Retry after “Call cut”', hint: 'Minutes', unit: 'min', min: 5, max: 10080 },
  { key: 'nurture_after_misses', label: 'Move to Nurture after', hint: 'Missed calls in a row', unit: 'calls', min: 2, max: 50 },
  { key: 'nurture_days', label: 'Nurture reminder after', hint: 'Days', unit: 'days', min: 1, max: 365 },
  { key: 're_engage_days', label: 'Re-engage lost leads after', hint: 'Days (unless their agency contract end is known)', unit: 'days', min: 1, max: 730 },
  { key: 'quote_follow_up_days', label: 'Follow up on a quote after', hint: 'Days', unit: 'days', min: 1, max: 60 },
  { key: 'default_daily_quota', label: 'Default daily quota for new members', hint: 'Fresh leads per day', unit: 'leads', min: 0, max: 500 },
  { key: 'idle_timeout_minutes', label: 'Sign out after inactivity', hint: 'Minutes', unit: 'min', min: 5, max: 1440 },
];

export function SettingsPage() {
  const qc = useQueryClient();
  const s = useSettings();
  const [v, setV] = useState<Record<Key, string> | null>(null);
  const [errs, setErrs] = useState<Partial<Record<Key, string>>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (s.data && !v) setV(Object.fromEntries(FIELDS.map((f) => [f.key, String(s.data[f.key])])) as Record<Key, string>);
  }, [s.data, v]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!v) return;
    const er: Partial<Record<Key, string>> = {};
    const patch: Partial<CrmSettings> = {};
    for (const f of FIELDS) {
      const n = Number(v[f.key]);
      if (!Number.isInteger(n) || n < f.min || n > f.max) er[f.key] = `Use a whole number from ${f.min} to ${f.max}.`;
      else (patch as Record<string, number>)[f.key] = n;
    }
    setErrs(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const { error } = await supabase.from('crm_settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', 1);
    setBusy(false);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success('Settings saved.');
    void qc.invalidateQueries({ queryKey: qk.settings });
  }

  return (
    <>
      <PageHeader title="Settings" description="How the pipeline automation behaves for everyone. The CRM runs 24×7, so retries are never shifted to office hours." />
      <Card className="mb-6">
        <CardHeader title="Automation" />
        {s.isLoading || !v ? <Spinner /> : s.isError ? <ErrorState message={friendlyError(s.error)} /> : (
          <form onSubmit={save} noValidate className="p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <Field key={f.key} label={f.label} hint={f.hint} error={errs[f.key]}>
                  {({ id, describedBy, invalid }) => (
                    <div className="flex items-center gap-2">
                      <input id={id} inputMode="numeric" value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value.replace(/\D/g, '') })}
                        className={inputClass} aria-describedby={describedBy} aria-invalid={invalid || undefined} />
                      <span className="w-12 text-xs text-muted-foreground">{f.unit}</span>
                    </div>
                  )}
                </Field>
              ))}
            </div>
            <div className="mt-5 flex justify-end"><Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</Btn></div>
          </form>
        )}
      </Card>
      <AuditLog />
    </>
  );
}

function AuditLog() {
  const names = new Map((useProfiles().data ?? []).map((p) => [p.id, p.name]));
  const q = useQuery({
    queryKey: qk.audit,
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(150);
      if (error) throw new Error(error.message);
      return data;
    },
  });
  return (
    <Card>
      <CardHeader title="Audit log" description="Sign-ins, account changes, imports, exports, reassignments — latest 150" />
      {q.isLoading ? <Spinner /> : q.isError ? <ErrorState message={friendlyError(q.error)} onRetry={() => void q.refetch()} /> : (
        <div className="max-h-[32rem] overflow-y-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Audit log</caption>
            <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
              <tr><th scope="col" className="px-4 py-2 font-medium">When</th><th scope="col" className="px-4 py-2 font-medium">Who</th><th scope="col" className="px-4 py-2 font-medium">What</th><th scope="col" className="px-4 py-2 font-medium">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(q.data ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-muted-foreground">{formatDateTime(r.created_at)}</td>
                  <td className="px-4 py-2">{r.actor_id ? names.get(r.actor_id) ?? 'Former member' : 'System'}</td>
                  <td className="px-4 py-2 font-mono text-xs">{r.action}</td>
                  <td className="max-w-md truncate px-4 py-2 text-xs text-muted-foreground" title={JSON.stringify(r.detail)}>{summarise(r.detail)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function summarise(detail: unknown): string {
  if (!detail || typeof detail !== 'object') return '';
  return Object.entries(detail as Record<string, unknown>)
    .filter(([k]) => k !== 'leads' && k !== 'filters')
    .map(([k, val]) => `${k.replace(/_/g, ' ')}: ${Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? '…' : String(val)}`)
    .join(' · ');
}
