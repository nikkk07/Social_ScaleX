'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarCheck2, ExternalLink, MessageCircle, MoreHorizontal, Phone, Video } from 'lucide-react';
import * as DM from '@radix-ui/react-dropdown-menu';
import type { LeadStage, LeadTask } from '@/lib/database.types';
import { Badge } from '../ui/kit';
import { Btn } from '../ui/Modal';
import { TASK_LABEL, TASK_TONE, MEETING_MODE_LABEL, STAGE_LABEL } from '../lib/labels';
import { formatDate, formatTime, lateBy } from '../lib/time';
import { useOutcome } from '../outcome/OutcomeProvider';
import { useContactLead } from '../outcome/useContactLead';
import { RescheduleDialog, CancelTaskDialog } from './TaskDialogs';
import { invalidateCrm } from '../data/hooks';
import { cn } from '@/components/ui/utils';

export interface TaskItemData extends Pick<LeadTask, 'id' | 'lead_id' | 'type' | 'due_at' | 'note' | 'meeting_mode' | 'location' | 'reschedule_count' | 'status' | 'result' | 'completed_at' | 'assignee_id'> {
  lead: { id: string; brand_name: string; stage: LeadStage; dnc?: boolean } | null;
}

export function TaskItem({ task, showLead = true, assigneeName, showDate = false }: {
  task: TaskItemData; showLead?: boolean; assigneeName?: string | null; showDate?: boolean;
}) {
  const qc = useQueryClient();
  const { openMeetingOutcome } = useOutcome();
  const { contact, pickerEl } = useContactLead();
  const [dialog, setDialog] = useState<'reschedule' | 'cancel' | null>(null);
  const late = task.status === 'open' ? lateBy(task.due_at) : null;
  const brand = task.lead?.brand_name ?? 'Lead';
  const isMeeting = task.type === 'meeting';
  const joinUrl = isMeeting && task.location && /^https:\/\//i.test(task.location) ? task.location : null;
  const refresh = () => { setDialog(null); invalidateCrm(qc, task.lead_id); };

  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="w-20 shrink-0 pt-0.5 text-sm">
          {showDate ? <div className="text-xs text-muted-foreground">{formatDate(task.status === 'open' ? task.due_at : (task.completed_at ?? task.due_at))}</div> : null}
          <div className="font-medium tabular">{formatTime(task.status === 'open' ? task.due_at : (task.completed_at ?? task.due_at))}</div>
          {late ? (
            <div className="mt-0.5 flex items-center gap-1 text-xs font-medium text-destructive">
              <AlertTriangle className="size-3" aria-hidden="true" /> {late}
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TASK_TONE[task.type]}>{TASK_LABEL[task.type]}</Badge>
            {showLead && task.lead ? (
              <Link href={`/crm/leads/${task.lead.id}`} className="truncate text-sm font-semibold hover:underline">
                {task.lead.brand_name}
              </Link>
            ) : null}
            {task.lead && showLead ? <span className="text-xs text-muted-foreground">{STAGE_LABEL[task.lead.stage]}</span> : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {isMeeting && task.meeting_mode ? `${MEETING_MODE_LABEL[task.meeting_mode]}${task.location && !joinUrl ? ` · ${task.location}` : ''}. ` : ''}
            {task.note ?? ''}
            {task.status !== 'open' && task.result ? ` Result: ${task.result.replace(/_/g, ' ')}.` : ''}
          </p>
          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
            {assigneeName ? <span>{assigneeName}</span> : null}
            {task.reschedule_count > 0 ? <span>Rescheduled {task.reschedule_count}×</span> : null}
          </div>
        </div>
      </div>

      {task.status === 'open' && task.lead ? (
        <div className={cn('flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end')}>
          {isMeeting ? (
            <>
              {joinUrl ? (
                <a href={joinUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium hover:bg-muted">
                  <Video className="size-4" aria-hidden="true" /> Join
                </a>
              ) : null}
              <Btn size="sm" onClick={() => openMeetingOutcome(task, brand)}>
                <CalendarCheck2 aria-hidden="true" /> Outcome
              </Btn>
            </>
          ) : (
            <>
              <Btn size="sm" onClick={() => void contact(task.lead as NonNullable<TaskItemData['lead']>, 'call', task.id)} disabled={task.lead.dnc}>
                <Phone aria-hidden="true" /> Call
              </Btn>
              <Btn size="sm" variant="secondary" aria-label={`WhatsApp ${brand}`} title="WhatsApp"
                onClick={() => void contact(task.lead as NonNullable<TaskItemData['lead']>, 'whatsapp', task.id)} disabled={task.lead.dnc}>
                <MessageCircle aria-hidden="true" />
              </Btn>
            </>
          )}
          <DM.Root>
            <DM.Trigger asChild>
              <button type="button" className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted" aria-label={`More actions for ${brand}`}>
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </button>
            </DM.Trigger>
            <DM.Portal>
              <DM.Content align="end" sideOffset={4} className="z-50 min-w-44 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg">
                <DM.Item onSelect={() => setDialog('reschedule')} className="cursor-pointer rounded-md px-2.5 py-1.5 outline-none data-[highlighted]:bg-muted">Reschedule…</DM.Item>
                <DM.Item onSelect={() => setDialog('cancel')} className="cursor-pointer rounded-md px-2.5 py-1.5 text-destructive outline-none data-[highlighted]:bg-muted">Cancel…</DM.Item>
                <DM.Separator className="my-1 h-px bg-border" />
                <DM.Item asChild className="cursor-pointer rounded-md px-2.5 py-1.5 outline-none data-[highlighted]:bg-muted">
                  <Link href={`/crm/leads/${task.lead.id}`} className="flex items-center gap-2">Open lead <ExternalLink className="size-3.5" aria-hidden="true" /></Link>
                </DM.Item>
              </DM.Content>
            </DM.Portal>
          </DM.Root>
        </div>
      ) : null}

      {dialog === 'reschedule' ? <RescheduleDialog task={task} brand={brand} onClose={() => setDialog(null)} onSaved={refresh} /> : null}
      {dialog === 'cancel' ? <CancelTaskDialog task={task} brand={brand} onClose={() => setDialog(null)} onSaved={refresh} /> : null}
      {pickerEl}
    </li>
  );
}
