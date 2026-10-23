'use client';
import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Base {
  label: string;
  error?: string;
  hint?: string;
}

function Shell({ id, label, error, hint, children }: Base & { id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      {children}
      {error ? (
        <p id={`${id}-err`} className="text-xs font-medium text-critical">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & Base & {
  value: string;
  onChange: (v: string) => void;
};

export function TextField({ label, error, hint, value, onChange, className = '', ...rest }: InputProps) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        className={`field w-full ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        {...rest}
      />
    </Shell>
  );
}

export function PasswordField({ label, error, hint, value, onChange, ...rest }: InputProps) {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="field w-full pr-12"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-[inherit] text-ink-3 hover:text-ink"
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
        </button>
      </div>
    </Shell>
  );
}

/** Indian mobile with a fixed +91. Keeps digits only, max 10. */
export function MobileField({ label, error, hint, value, onChange, ...rest }: InputProps) {
  const id = useId();
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <div className={`field flex w-full items-stretch gap-0 overflow-hidden p-0 focus-within:border-ink focus-within:shadow-[0_0_0_3px_var(--color-coral-tint)] ${error ? 'border-critical' : ''}`}>
        <span className="flex select-none items-center border-r border-line bg-paper-2 px-3 font-semibold text-ink-2">+91</span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none"
          value={value}
          placeholder="98765 43210"
          onChange={(e) => {
            let d = e.target.value.replace(/\D/g, '');
            if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
            if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
            onChange(d.slice(0, 10));
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          {...rest}
        />
      </div>
    </Shell>
  );
}

export function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 flex-none accent-[var(--color-ink)]" />
      <span>{children}</span>
    </label>
  );
}
