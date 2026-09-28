'use client';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { formatPhone } from '@/lib/crm/normalize';
import { Modal, Btn } from '../ui/Modal';
import { asJson, rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import type { LeadBundle } from '../data/hooks';
import { ContactsFields, contactsPayload, emptyContact, validateContacts, type ContactsDraft } from './ContactsFields';

function fromBundle(b: LeadBundle): ContactsDraft {
  return {
    contacts: b.contacts.length
      ? b.contacts.map((c) => ({
          name: c.name, designation: c.designation ?? '', email: c.email ?? '', is_primary: c.is_primary,
          phones: c.phones.length
            ? c.phones.map((p) => ({ phone: formatPhone(p.phone_e164), label: p.label ?? '', is_primary: p.is_primary }))
            : [{ phone: '', label: 'Mobile', is_primary: true }],
        }))
      : [emptyContact(true)],
    office: b.officePhones.map((p) => ({ phone: formatPhone(p.phone_e164), label: p.label ?? 'Office', is_primary: p.is_primary })),
  };
}

export function ContactsEditor({ b, onClose, onSaved }: { b: LeadBundle; onClose: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<ContactsDraft>(() => fromBundle(b));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    const er = validateContacts(draft);
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await rpc('update_lead_with_contacts', { p_lead_id: b.lead.id, payload: asJson(contactsPayload(draft)) });
      toast.success('Contacts saved.');
      onSaved();
    } catch (e2) {
      toast.error(friendlyError(e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onOpenChange={(o) => { if (!o) onClose(); }} size="lg" title={`Contacts · ${b.lead.brand_name}`} onSubmit={save}
      description="Numbers marked as wrong or not on WhatsApp keep that flag if you leave them unchanged."
      footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save contacts'}</Btn></>}>
      <ContactsFields value={draft} onChange={setDraft} errors={errors} />
    </Modal>
  );
}
