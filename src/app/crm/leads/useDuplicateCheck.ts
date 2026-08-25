// Duplicate detection for the lead form. The DB cannot cover this: a repeated
// handle is caught by leads_instagram_unique, but a repeated PHONE is caught by
// nothing (lead_phones has only a plain index, and shared numbers are
// legitimate — so this is a warning, never a constraint). Two prospectors
// adding the same brand under different names, sharing an office line, is the
// exact miss a CRM exists to prevent.
//
// Non-blocking: we warn and link to the existing lead, and let the user save.
import { useCallback, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { normalizeHandle, type LeadFormValues } from './leadFormSchema';

const E164 = /^\+[1-9]\d{6,14}$/;

export interface DupLead {
  id: string;
  brand_name: string;
}

export interface DuplicateCheck {
  handleDup: DupLead | null;
  phoneDups: Record<string, DupLead>; // phone_e164 -> existing lead
  checkHandle: (raw: string) => void;
  checkPhone: (raw: string) => void;
  /** Re-run everything (blur checks go stale); returns true if any dup found. */
  checkAll: (values: LeadFormValues) => Promise<boolean>;
}

export function useDuplicateCheck(excludeId?: string): DuplicateCheck {
  const [handleDup, setHandleDup] = useState<DupLead | null>(null);
  const [phoneDups, setPhoneDups] = useState<Record<string, DupLead>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastHandle = useRef<string>('');

  const debounce = (key: string, fn: () => void) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(fn, 400);
  };

  const findHandle = useCallback(
    async (h: string): Promise<DupLead | null> => {
      const { data } = await supabase
        .from('leads')
        .select('id, brand_name')
        .eq('instagram_username', h)
        .is('deleted_at', null)
        .limit(2);
      return (data ?? []).find((l) => l.id !== excludeId) ?? null;
    },
    [excludeId],
  );

  const findPhone = useCallback(
    async (v: string): Promise<DupLead | null> => {
      const { data } = await supabase
        .from('lead_phones')
        .select('lead_id, leads(id, brand_name, deleted_at)')
        .eq('phone_e164', v)
        .limit(20);
      const hit = (data ?? [])
        .map((r) => r.leads as unknown as { id: string; brand_name: string; deleted_at: string | null } | null)
        .find((l) => l && !l.deleted_at && l.id !== excludeId);
      return hit ? { id: hit.id, brand_name: hit.brand_name } : null;
    },
    [excludeId],
  );

  const checkHandle = useCallback(
    (raw: string) => {
      const h = normalizeHandle(raw);
      if (!h) {
        setHandleDup(null);
        return;
      }
      if (h === lastHandle.current) return; // unchanged since last check
      lastHandle.current = h;
      debounce('handle', async () => setHandleDup(await findHandle(h)));
    },
    [findHandle],
  );

  const checkPhone = useCallback(
    (raw: string) => {
      const v = raw.trim();
      if (!E164.test(v)) return; // don't fire on empty/incomplete
      debounce(`phone:${v}`, async () => {
        const hit = await findPhone(v);
        setPhoneDups((prev) => {
          const next = { ...prev };
          if (hit) next[v] = hit;
          else delete next[v];
          return next;
        });
      });
    },
    [findPhone],
  );

  const checkAll = useCallback(
    async (values: LeadFormValues): Promise<boolean> => {
      let anyDup = false;

      const h = normalizeHandle(values.instagram_username ?? '');
      const hDup = h ? await findHandle(h) : null;
      setHandleDup(hDup);
      if (hDup) anyDup = true;

      const numbers = [
        ...values.contacts.flatMap((c) => c.phones.map((p) => p.phone_e164.trim())),
        ...values.lead_phones.map((p) => p.phone_e164.trim()),
      ].filter((v) => E164.test(v));

      const map: Record<string, DupLead> = {};
      for (const v of new Set(numbers)) {
        const hit = await findPhone(v);
        if (hit) {
          map[v] = hit;
          anyDup = true;
        }
      }
      setPhoneDups(map);
      return anyDup;
    },
    [findHandle, findPhone],
  );

  return { handleDup, phoneDups, checkHandle, checkPhone, checkAll };
}
