'use client';
// One modal for the whole CRM: centred card on desktop, bottom sheet on
// phones, scrollable body with a footer that never scrolls away. Radix
// handles focus trapping, Esc, and restoring focus to the trigger.
import React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/components/ui/utils';

export function Modal({ open, onOpenChange, title, description, children, footer, size = 'md', closeLabel = 'Close', onSubmit }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeLabel?: string;
  onSubmit?: (e: React.FormEvent) => void;
}) {
  const Body = onSubmit ? 'form' : 'div';
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/45 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <D.Content
          className={cn(
            'fixed z-50 flex max-h-[92vh] w-full flex-col border border-border bg-card text-card-foreground shadow-xl outline-none',
            'bottom-0 left-0 rounded-t-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-0',
            size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
          )}
        >
          <Body
            className="flex min-h-0 flex-1 flex-col"
            {...(onSubmit ? { onSubmit, noValidate: true } : {})}
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <D.Title className="text-base font-semibold leading-6">{title}</D.Title>
                {description ? (
                  <D.Description className="mt-0.5 text-sm text-muted-foreground">{description}</D.Description>
                ) : (
                  <D.Description className="sr-only">{typeof title === 'string' ? title : 'Dialog'}</D.Description>
                )}
              </div>
              <D.Close
                className="-mr-1 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={closeLabel}
                title={closeLabel}
              >
                <X className="size-4" aria-hidden="true" />
              </D.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? (
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>
            ) : null}
          </Body>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

export function Btn({ variant = 'primary', size = 'md', className, children, ...rest }: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-55',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'secondary' && 'border border-border bg-card text-foreground hover:bg-muted',
        variant === 'ghost' && 'text-foreground hover:bg-muted',
        variant === 'danger' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        variant === 'success' && 'bg-emerald-700 text-white hover:bg-emerald-800',
        className,
      )}
    >
      {children}
    </button>
  );
}
