'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, LogOut } from 'lucide-react';
import { XMark } from '@/components/site/Logo';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { appSupabase } from '@/lib/app/client';
import { whatsappLink } from '@/lib/site';

const HELP = whatsappLink('Hi Social ScaleX, I need help with the comment-to-DM automation.');

/** Redirects to /start when signed out. Returns the email once a session exists. */
export function useRequireSession(): { ready: boolean; email: string | null } {
  const router = useRouter();
  const path = usePathname();
  const [state, setState] = useState<{ ready: boolean; email: string | null }>({ ready: false, email: null });
  useEffect(() => {
    let alive = true;
    const sb = appSupabase();
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (!data.session) router.replace(`/start?next=${encodeURIComponent(path + window.location.search)}`);
      else setState({ ready: true, email: data.session.user.email ?? null });
    });
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/start');
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [router, path]);
  return state;
}

export function AppShell({ children, email }: { children: React.ReactNode; email?: string | null }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/dashboard" aria-label="Dashboard" className="inline-flex items-baseline font-display text-xl font-semibold tracking-[-0.02em] text-ink">
            Social Scale<XMark className="h-[0.95em] w-auto translate-y-[0.16em]" /><span className="sr-only">X</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <a href={HELP} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink">
              <WhatsappIcon size={16} /> <span className="hidden sm:inline">Help</span>
            </a>
            {email ? (
              <button
                type="button"
                onClick={async () => {
                  await appSupabase().auth.signOut();
                  router.replace('/start');
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 font-semibold text-ink-2 hover:bg-paper-2 hover:text-ink"
                title={email}
              >
                <LogOut className="size-4" aria-hidden="true" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:pt-10">{children}</main>
    </div>
  );
}

const STEPS = ['Sign up', 'Connect Instagram', 'Set up', 'Pay ₹99', 'Live'] as const;

/** The five-step progress line shown until an account is live. `at` = current step index. */
export function Stepper({ at }: { at: number }) {
  return (
    <ol aria-label="Progress" className="mb-8 flex items-center gap-1 overflow-x-auto pb-1 text-xs sm:text-sm">
      {STEPS.map((s, i) => {
        const done = i < at;
        const now = i === at;
        return (
          <li key={s} className="flex flex-none items-center gap-1" aria-current={now ? 'step' : undefined}>
            <span
              className={`grid size-6 place-items-center rounded-full text-[11px] font-bold ${
                done ? 'bg-positive text-white' : now ? 'bg-ink text-white' : 'bg-paper-2 text-ink-3 ring-1 ring-line'
              }`}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={`whitespace-nowrap font-semibold ${now ? 'text-ink' : done ? 'text-ink-2' : 'text-ink-3'}`}>{s}</span>
            {i < STEPS.length - 1 ? <span aria-hidden="true" className="mx-1 h-px w-4 bg-line-strong sm:w-8" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function Notice({ tone, children }: { tone: 'info' | 'warn' | 'error' | 'ok'; children: React.ReactNode }) {
  const cls = {
    info: 'border-line bg-surface text-ink-2',
    warn: 'border-coral/40 bg-coral-tint text-ink',
    error: 'border-critical/40 bg-critical/5 text-ink',
    ok: 'border-positive/40 bg-positive/5 text-ink',
  }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`mb-6 rounded-card border p-4 text-sm leading-relaxed ${cls}`}>
      {children}
    </div>
  );
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-16 text-ink-3">
      <span aria-hidden="true" className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-ink" />
      {label}
    </div>
  );
}

export function Avatar({ src, name }: { src: string | null; name: string }) {
  // Instagram CDN URLs are signed and expire; fall back to the initial.
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return <span className="grid size-11 flex-none place-items-center rounded-full bg-coral-tint font-display text-lg text-coral-text">{name.slice(0, 1).toUpperCase()}</span>;
  }
  // eslint-disable-next-line @next/next/no-img-element -- remote, signed, short-lived Instagram CDN image
  return <img src={src} alt="" width={44} height={44} onError={() => setBroken(true)} className="size-11 flex-none rounded-full object-cover ring-1 ring-line" />;
}
