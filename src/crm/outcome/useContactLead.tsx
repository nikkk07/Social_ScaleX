'use client';
// "Call" / "WhatsApp" from anywhere that only knows the lead: loads its
// phones, uses the only valid one straight away, or asks which to use.
import React, { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { MessageCircle, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ContactChannel, LeadStage } from '@/lib/database.types';
import { formatPhone } from '@/lib/crm/normalize';
import { Modal, Btn } from '../ui/Modal';
import { useOutcome } from './OutcomeProvider';
import { friendlyError } from '../lib/errors';

interface PhoneOpt { id: string; phone_e164: string; label: string | null; is_primary: boolean; contact: string | null }

export function useContactLead() {
  const { startContact } = useOutcome();
  const [picker, setPicker] = useState<{
    lead: { id: string; brand_name: string; stage: LeadStage }; channel: ContactChannel; taskId?: string | null; phones: PhoneOpt[];
  } | null>(null);

  const contact = useCallback(async (
    lead: { id: string; brand_name: string; stage: LeadStage; dnc?: boolean },
    channel: ContactChannel,
    taskId?: string | null,
  ) => {
    if (lead.dnc) {
      toast.error('This lead asked not to be contacted.');
      return;
    }
    const { data, error } = await supabase
      .from('lead_phones')
      .select('id, phone_e164, label, is_primary, is_invalid, no_whatsapp, sort_order, contact:lead_contacts(name, is_primary)')
      .eq('lead_id', lead.id);
    if (error) { toast.error(friendlyError(error)); return; }
    const phones = (data ?? [])
      .filter((p) => !p.is_invalid && !(channel === 'whatsapp' && p.no_whatsapp))
      .sort((a, b) => {
        const ca = (a.contact as { is_primary?: boolean } | null)?.is_primary ? 1 : 0;
        const cb = (b.contact as { is_primary?: boolean } | null)?.is_primary ? 1 : 0;
        return cb - ca || Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order;
      })
      .map<PhoneOpt>((p) => ({
        id: p.id, phone_e164: p.phone_e164, label: p.label, is_primary: p.is_primary,
        contact: (p.contact as { name?: string } | null)?.name ?? null,
      }));
    if (phones.length === 0) {
      toast.error(channel === 'whatsapp' ? 'No WhatsApp number on this lead.' : 'No valid phone number on this lead. Add one first.');
      return;
    }
    if (phones.length === 1) {
      await startContact({ lead, phone: phones[0] as PhoneOpt, channel, taskId });
      return;
    }
    setPicker({ lead, channel, taskId, phones });
  }, [startContact]);

  const pickerEl = picker ? (
    <Modal open size="sm" onOpenChange={(o) => { if (!o) setPicker(null); }}
      title={`${picker.channel === 'whatsapp' ? 'WhatsApp' : 'Call'} ${picker.lead.brand_name}`} description="Choose a number"
      footer={<Btn variant="secondary" onClick={() => setPicker(null)}>Cancel</Btn>}>
      <ul className="space-y-2">
        {picker.phones.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => { const pk = picker; setPicker(null); void startContact({ lead: pk.lead, phone: p, channel: pk.channel, taskId: pk.taskId }); }}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium tabular">{formatPhone(p.phone_e164)}</span>
                <span className="block text-xs text-muted-foreground">{[p.contact, p.label].filter(Boolean).join(' · ') || 'Office line'}</span>
              </span>
              {picker.channel === 'whatsapp' ? <MessageCircle className="size-4 text-muted-foreground" aria-hidden="true" /> : <Phone className="size-4 text-muted-foreground" aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  ) : null;

  return { contact, pickerEl };
}
