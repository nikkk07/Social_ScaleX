'use client';
// Small, consistent building blocks for every CRM screen. Tokens come from
// src/styles/crm.css, so light and dark both work without per-component
// colours.
import React, { useId } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { toneClasses, type Tone } from '../lib/labels';

export function Badge({ tone = 'neutral', className, children, title }: {
  tone?: Tone; className?: string; children: React.ReactNode; title?: string;
}) {
  return (
    <span
      title={title}
      className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium', toneClasses(tone), className)}
    >
      {children}
    </span>
  );
}

export function Card({ className, children, as: As = 'section', ...rest }: {
  className?: string; children: React.ReactNode; as?: 'section' | 'div' | 'article';
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={cn('rounded-xl border border-border bg-card text-card-foreground', className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({ title, description, action, className }: {
  title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 border-b border-border px-4 py-3', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, description, actions }: {
  title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Spinner({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn('flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground', className)}>
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: {
  icon?: React.ReactNode; title: string; children?: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon ? <div className="mb-3 text-muted-foreground" aria-hidden="true">{icon}</div> : null}
      <p className="text-sm font-medium">{title}</p>
      {children ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export const inputClass =
  'block w-full rounded-lg border border-input bg-input-background px-3 py-2 text-sm text-foreground ' +
  'placeholder:text-muted-foreground/70 shadow-xs outline-none transition-colors ' +
  'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-60 ' +
  'aria-[invalid=true]:border-destructive';

export function Field({ label, hint, error, required, children, className }: {
  label: React.ReactNode; hint?: React.ReactNode; error?: string | null; required?: boolean;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required ? <span className="ml-0.5 text-destructive" aria-hidden="true">*</span> : null}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error ? <p id={hintId} className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p id={errId} className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

/** A single-choice group of large, tappable chips (radio semantics). */
export function ChoiceChips<T extends string>({ label, value, options, onChange, columns = 2, name }: {
  label: string;
  value: T | null;
  options: readonly { value: T; label: string; hint?: string; icon?: React.ReactNode; tone?: 'danger' | 'success' }[];
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3;
  name?: string;
}) {
  const gid = useId();
  const groupName = name ?? gid;
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className={cn('grid gap-2', columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
        {options.map((o, i) => {
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              className={cn(
                'flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40',
                checked
                  ? o.tone === 'danger'
                    ? 'border-destructive bg-red-50 dark:bg-red-950/40'
                    : o.tone === 'success'
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'border-primary bg-accent'
                  : 'border-border hover:bg-muted',
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
                data-choice-index={i}
              />
              {o.icon ? <span className="mt-0.5 shrink-0" aria-hidden="true">{o.icon}</span> : null}
              <span className="min-w-0">
                <span className="block font-medium leading-5">{o.label}</span>
                {o.hint ? <span className="block text-xs text-muted-foreground">{o.hint}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function KpiTile({ label, value, hint, href, tone, icon, onClick }: {
  label: string; value: React.ReactNode; hint?: string; href?: string; tone?: 'danger' | 'default';
  icon?: React.ReactNode; onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon ? <span className="text-muted-foreground" aria-hidden="true">{icon}</span> : null}
      </div>
      <div className={cn('mt-1 text-2xl font-semibold tabular', tone === 'danger' && 'text-destructive')}>{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
    </>
  );
  const cls = 'block rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40';
  if (href) return <Link href={href} className={cls}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cn(cls, 'w-full')}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">{children}</kbd>;
}

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
