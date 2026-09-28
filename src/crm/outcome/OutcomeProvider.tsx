'use client';
// ─────────────────────────────────────────────────────────────────────
// Call / WhatsApp → outcome pop-up.
//
// A browser cannot know whether a phone call connected, so the CRM records
// the tap (a pending attempt on the server), hands off to the dialler or
// WhatsApp, and asks for the outcome the moment the agent comes back to the
// tab (Page Visibility API). On a desktop, where `tel:` rarely reaches a
// phone, a QR code lets the agent dial from their mobile instead.
//
// Unlogged attempts stay on the server, so a closed tab or a crash never
// loses them: they reappear in the "calls to log" tray, and after 3 of them
// the server refuses new calls until they are logged.
// ─────────────────────────────────────────────────────────────────────
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ContactChannel, LeadStage, LeadTask } from '@/lib/database.types';
import { waNumber } from '@/lib/crm/normalize';
import { rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { useAuth } from '../auth/AuthProvider';
import { invalidateCrm, usePendingAttempts, useRealtimeInvalidation, type PendingAttempt } from '../data/hooks';
import { OutcomeDialog } from './OutcomeDialog';
import { MeetingOutcomeDialog } from './MeetingOutcomeDialog';
import { DialDialog } from './DialDialog';

export interface ContactTarget {
  lead: { id: string; brand_name: string; stage: LeadStage };
  phone: { id: string; phone_e164: string };
  channel: ContactChannel;
  taskId?: string | null;
}

interface OutcomeValue {
  startContact: (t: ContactTarget) => Promise<void>;
  openOutcome: (a: PendingAttempt) => void;
  openMeetingOutcome: (task: Pick<LeadTask, 'id' | 'lead_id' | 'meeting_mode' | 'location' | 'due_at'>, brand: string) => void;
  pending: PendingAttempt[];
}

const Ctx = createContext<OutcomeValue | null>(null);

function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

export function OutcomeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const pendingQ = usePendingAttempts(profile?.id);
  useRealtimeInvalidation(profile?.id);
  const pending = useMemo(() => pendingQ.data ?? [], [pendingQ.data]);

  const [active, setActive] = useState<PendingAttempt | null>(null);
  const [dial, setDial] = useState<{ attempt: PendingAttempt } | null>(null);
  const [meeting, setMeeting] = useState<{
    task: Pick<LeadTask, 'id' | 'lead_id' | 'meeting_mode' | 'location' | 'due_at'>; brand: string;
  } | null>(null);

  // The attempt we are waiting to hear back about (agent left the tab).
  const awaiting = useRef<PendingAttempt | null>(null);
  const leftTab = useRef(false);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (awaiting.current) leftTab.current = true;
        return;
      }
      if (awaiting.current && leftTab.current) {
        const a = awaiting.current;
        awaiting.current = null;
        leftTab.current = false;
        setDial(null);
        setActive(a);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const startContact = useCallback(async (t: ContactTarget) => {
    let attemptId: string;
    try {
      attemptId = await rpc('start_attempt', {
        p_lead: t.lead.id, p_phone: t.phone.id, p_channel: t.channel, p_task: t.taskId ?? undefined,
      });
    } catch (e) {
      toast.error(friendlyError(e));
      return;
    }
    void qc.invalidateQueries({ queryKey: ['pending'] });
    const attempt: PendingAttempt = {
      id: attemptId, lead_id: t.lead.id, phone_id: t.phone.id, phone_e164: t.phone.phone_e164,
      channel: t.channel, started_at: new Date().toISOString(), task_id: t.taskId ?? null,
      lead: { id: t.lead.id, brand_name: t.lead.brand_name, stage: t.lead.stage },
    };
    awaiting.current = attempt;
    leftTab.current = false;

    if (t.channel === 'whatsapp') {
      // No 'noopener' feature string: with it, window.open always returns
      // null and a blocked pop-up could not be detected. Cut the link instead.
      const w = window.open(`https://wa.me/${waNumber(t.phone.phone_e164)}`, '_blank');
      if (w) {
        w.opener = null;
      } else {
        // Pop-up blocked: fall back to asking straight away.
        awaiting.current = null;
        setActive(attempt);
      }
      return;
    }
    if (isTouchDevice()) {
      window.location.href = `tel:${t.phone.phone_e164}`;
      // Some phones keep the page visible while dialling: offer the pop-up
      // after a moment if the tab never went to the background.
      window.setTimeout(() => {
        if (awaiting.current?.id === attemptId && !leftTab.current) {
          awaiting.current = null;
          setActive(attempt);
        }
      }, 4000);
    } else {
      setDial({ attempt });
    }
  }, [qc]);

  const openOutcome = useCallback((a: PendingAttempt) => {
    awaiting.current = null;
    setDial(null);
    setActive(a);
  }, []);

  const openMeetingOutcome = useCallback<OutcomeValue['openMeetingOutcome']>((task, brand) => {
    setMeeting({ task, brand });
  }, []);

  const done = useCallback((leadId: string) => {
    invalidateCrm(qc, leadId);
  }, [qc]);

  const value = useMemo(() => ({ startContact, openOutcome, openMeetingOutcome, pending }),
    [startContact, openOutcome, openMeetingOutcome, pending]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {dial ? (
        <DialDialog
          attempt={dial.attempt}
          onLog={() => openOutcome(dial.attempt)}
          onClose={() => { awaiting.current = null; setDial(null); }}
        />
      ) : null}
      {active ? (
        <OutcomeDialog
          key={active.id}
          attempt={active}
          onClose={() => setActive(null)}
          onSaved={(leadId) => { setActive(null); done(leadId); }}
          onDiscarded={(leadId) => { setActive(null); done(leadId); }}
        />
      ) : null}
      {meeting ? (
        <MeetingOutcomeDialog
          key={meeting.task.id}
          task={meeting.task}
          brand={meeting.brand}
          onClose={() => setMeeting(null)}
          onSaved={(leadId) => { setMeeting(null); done(leadId); }}
        />
      ) : null}
    </Ctx.Provider>
  );
}

export function useOutcome(): OutcomeValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOutcome outside OutcomeProvider');
  return v;
}
