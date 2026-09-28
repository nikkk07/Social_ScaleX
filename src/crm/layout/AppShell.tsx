'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as D from '@radix-ui/react-dialog';
import * as DM from '@radix-ui/react-dropdown-menu';
import {
  BarChart3, CalendarClock, ChevronDown, Home, Inbox, LogOut, Menu, Monitor, Moon, PhoneCall, Settings, Sun,
  UserCircle2, Users, X, Contact2,
} from 'lucide-react';
import { useAuth, useMe } from '../auth/AuthProvider';
import { useTheme, type ThemeChoice } from '../theme';
import { useDashboard } from '../data/hooks';
import { useOutcome } from '../outcome/OutcomeProvider';
import { ROLE_LABEL } from '../lib/labels';
import { relative } from '../lib/time';
import { Reminders } from './Reminders';
import { cn } from '@/components/ui/utils';

interface NavItem { href: string; label: string; icon: React.ReactNode; badge?: number; badgeTone?: 'danger' | 'default'; admin?: boolean }

function useNav(): NavItem[] {
  const dash = useDashboard().data;
  const followBadge = dash ? dash.overdue + dash.due_today : undefined;
  return [
    { href: '/crm', label: 'Today', icon: <Home className="size-4" /> },
    { href: '/crm/follow-ups', label: 'Follow-ups', icon: <CalendarClock className="size-4" />, badge: followBadge, badgeTone: dash && dash.overdue > 0 ? 'danger' : 'default' },
    { href: '/crm/leads', label: 'Leads', icon: <Contact2 className="size-4" /> },
    { href: '/crm/enquiries', label: 'Enquiries', icon: <Inbox className="size-4" />, badge: dash?.open_enquiries },
    { href: '/crm/insights', label: 'Insights', icon: <BarChart3 className="size-4" /> },
    { href: '/crm/team', label: 'Team', icon: <Users className="size-4" />, admin: true },
    { href: '/crm/settings', label: 'Settings', icon: <Settings className="size-4" />, admin: true },
  ];
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/crm') return pathname === '/crm';
  return pathname === href || pathname.startsWith(href + '/');
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/crm';
  const { isAdmin } = useMe();
  return (
    <nav aria-label="CRM" className="space-y-0.5">
      {useNav().filter((n) => !n.admin || isAdmin).map((n) => {
        const active = isActive(pathname, n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span aria-hidden="true">{n.icon}</span>
            <span className="flex-1">{n.label}</span>
            {n.badge ? (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-center text-xs font-semibold tabular',
                  n.badgeTone === 'danger' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-foreground',
                )}
                aria-label={`${n.badge} ${n.label === 'Follow-ups' ? 'due' : 'open'}`}
              >
                {n.badge > 99 ? '99+' : n.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeSwitch() {
  const { choice, setChoice } = useTheme();
  const opts: { v: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    { v: 'light', label: 'Light', icon: <Sun className="size-3.5" /> },
    { v: 'dark', label: 'Dark', icon: <Moon className="size-3.5" /> },
    { v: 'system', label: 'System', icon: <Monitor className="size-3.5" /> },
  ];
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          role="radio"
          aria-checked={choice === o.v}
          onClick={() => setChoice(o.v)}
          title={o.label}
          className={cn(
            'flex items-center justify-center gap-1 rounded-md py-1 text-xs',
            choice === o.v ? 'bg-card font-medium text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span aria-hidden="true">{o.icon}</span><span className="sr-only sm:not-sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function UserMenu() {
  const { profile, role } = useMe();
  const { signOut } = useAuth();
  const name = profile.full_name || profile.email;
  return (
    <DM.Root>
      <DM.Trigger asChild>
        <button type="button" aria-label={`Account menu: ${name}, ${ROLE_LABEL[role]}`} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-muted">
          <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            {initials(name)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{name}</span>
            <span className="block text-xs text-muted-foreground">{ROLE_LABEL[role]}</span>
          </span>
          <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </DM.Trigger>
      <DM.Portal>
        <DM.Content side="top" align="start" sideOffset={6} className="z-50 w-60 rounded-xl border border-border bg-popover p-2 text-sm text-popover-foreground shadow-lg">
          <div className="px-1 pb-2"><ThemeSwitch /></div>
          <DM.Item asChild className="cursor-pointer rounded-md px-2 py-1.5 outline-none data-[highlighted]:bg-muted">
            <Link href="/crm/account" className="flex items-center gap-2"><UserCircle2 className="size-4" aria-hidden="true" /> My account</Link>
          </DM.Item>
          <DM.Item onSelect={() => void signOut()} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none data-[highlighted]:bg-muted">
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </DM.Item>
        </DM.Content>
      </DM.Portal>
    </DM.Root>
  );
}

function initials(s: string): string {
  const parts = s.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function Brand() {
  return (
    <Link href="/crm" className="flex items-center gap-2 px-2 text-sm font-semibold">
      <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">SX</span>
      <span>Social ScaleX <span className="font-normal text-muted-foreground">CRM</span></span>
    </Link>
  );
}

function PendingBanner() {
  const { pending, openOutcome } = useOutcome();
  if (pending.length === 0) return null;
  const first = pending[0];
  if (!first) return null;
  return (
    <div role="status" className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <PhoneCall className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">
        {pending.length === 1
          ? <>Log how the {first.channel === 'whatsapp' ? 'WhatsApp' : 'call'} with <strong>{first.lead?.brand_name ?? 'a lead'}</strong> went ({relative(first.started_at)}).</>
          : <><strong>{pending.length} calls</strong> are waiting for an outcome. New calls are blocked after 3.</>}
      </span>
      <button type="button" onClick={() => openOutcome(first)} className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-950 dark:bg-amber-200 dark:text-amber-950">
        Log now
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15.5rem_1fr]">
      <a href="#crm-main" className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
        <Brand />
        <div className="mt-6 flex-1 overflow-y-auto"><NavList /></div>
        <div className="border-t border-sidebar-border pt-3"><UserMenu /></div>
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card/95 px-3 py-2 backdrop-blur lg:hidden">
        <Brand />
        <D.Root open={open} onOpenChange={setOpen}>
          <D.Trigger asChild>
            <button type="button" className="inline-flex size-10 items-center justify-center rounded-lg hover:bg-muted" aria-label="Open menu">
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </D.Trigger>
          <D.Portal>
            <D.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <D.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar px-3 py-4 shadow-xl outline-none">
              <D.Title className="sr-only">Menu</D.Title>
              <D.Description className="sr-only">CRM sections and account</D.Description>
              <div className="flex items-center justify-between">
                <Brand />
                <D.Close className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted" aria-label="Close menu">
                  <X className="size-5" aria-hidden="true" />
                </D.Close>
              </div>
              <div className="mt-6 flex-1 overflow-y-auto"><NavList onNavigate={() => setOpen(false)} /></div>
              <div className="border-t border-sidebar-border pt-3"><UserMenu /></div>
            </D.Content>
          </D.Portal>
        </D.Root>
      </header>

      <main id="crm-main" tabIndex={-1} className="min-w-0 px-4 py-5 outline-none sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto max-w-6xl">
          <PendingBanner />
          <Reminders />
          {children}
        </div>
      </main>
    </div>
  );
}
