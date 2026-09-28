'use client';
// In-app reminders: 15 minutes before one of your follow-ups is due, show a
// toast (and a desktop notification if you allowed them in My account).
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useMe } from '../auth/AuthProvider';
import { useTasks } from '../data/hooks';
import { TASK_LABEL } from '../lib/labels';
import { formatTime } from '../lib/time';

const LEAD_MS = 15 * 60_000;
const KEY = 'ssx-crm-reminded';

function remembered(): Set<string> {
  try {
    return new Set(JSON.parse(window.sessionStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}
function remember(ids: Set<string>) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* ignore */
  }
}

export function Reminders() {
  const { id } = useMe();
  const router = useRouter();
  // Everything of mine due in the next hour; refreshed every minute.
  const tasks = useTasks({ status: 'open', assignee: id, to: new Date(Date.now() + 60 * 60_000).toISOString(), limit: 50 });
  const refetch = tasks.refetch;
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    seen.current = remembered();
    const t = window.setInterval(() => void refetch(), 60_000);
    return () => window.clearInterval(t);
  }, [refetch]);

  useEffect(() => {
    const now = Date.now();
    for (const task of tasks.data ?? []) {
      const due = new Date(task.due_at).getTime();
      if (due < now - 60_000 || due - now > LEAD_MS || seen.current.has(task.id)) continue;
      seen.current.add(task.id);
      const title = `${TASK_LABEL[task.type]} at ${formatTime(task.due_at)}`;
      const body = task.lead?.brand_name ?? '';
      toast(title, {
        description: body,
        duration: 20_000,
        action: { label: 'Open', onClick: () => router.push(`/crm/leads/${task.lead_id}`) },
      });
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        try {
          const n = new Notification(title, { body, tag: task.id });
          n.onclick = () => { window.focus(); router.push(`/crm/leads/${task.lead_id}`); };
        } catch {
          /* some browsers only allow notifications from a service worker */
        }
      }
    }
    remember(seen.current);
  }, [tasks.data, router]);

  return null;
}
