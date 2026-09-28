'use client';
// Date + time picker that always means India time, with one-tap presets.
import React from 'react';
import { Field, inputClass } from './kit';
import { addDaysKey, fromIstLocalInput, suggestedTime, toIstLocalInput, todayKey } from '../lib/time';
import { cn } from '@/components/ui/utils';

function at(key: string, hh: number, mm = 0): Date {
  return new Date(`${key}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+05:30`);
}

function nextMonday(): string {
  const now = new Date(Date.now() + 330 * 60_000);
  const dow = now.getUTCDay(); // 0 Sun … 6 Sat, in IST terms
  const add = ((8 - dow) % 7) || 7;
  return addDaysKey(todayKey(), add);
}

export function presets(): { label: string; value: Date }[] {
  const now = Date.now();
  const t = todayKey();
  const list = [
    { label: 'In 1 hour', value: suggestedTime(60) },
    { label: 'This evening, 6 PM', value: at(t, 18) },
    { label: 'Tomorrow, 11 AM', value: at(addDaysKey(t, 1), 11) },
    { label: 'Monday, 11 AM', value: at(nextMonday(), 11) },
  ];
  return list.filter((p) => p.value.getTime() > now + 5 * 60_000);
}

export function DateTimeField({ label, value, onChange, error, required = true, hint }: {
  label: string;
  value: string | null; // ISO
  onChange: (iso: string | null) => void;
  error?: string | null;
  required?: boolean;
  hint?: string;
}) {
  const local = value ? toIstLocalInput(value) : '';
  return (
    <Field label={label} required={required} error={error} hint={hint ?? 'India time (IST)'}>
      {({ id, describedBy, invalid }) => (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Quick times">
            {presets().map((p) => {
              const active = value && Math.abs(new Date(value).getTime() - p.value.getTime()) < 60_000;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => onChange(p.value.toISOString())}
                  aria-pressed={!!active}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    active ? 'border-primary bg-accent text-accent-foreground' : 'border-border hover:bg-muted',
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          <input
            id={id}
            type="datetime-local"
            value={local}
            min={toIstLocalInput(new Date())}
            onChange={(e) => onChange(fromIstLocalInput(e.target.value))}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={inputClass}
          />
        </div>
      )}
    </Field>
  );
}
