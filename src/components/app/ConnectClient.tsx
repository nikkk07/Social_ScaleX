'use client';
// ─────────────────────────────────────────────────────────────────────
// /dashboard/connect — find your Instagram account, confirm it, connect it.
//
// 1. Type a username (or paste a profile link). On every pause the exact
//    account is looked up and shown with its real photo, name and numbers.
// 2. "Yes, this is my account" → a short confirm sheet.
// 3. "Continue to Instagram" → Instagram's own login for that account,
//    which is the only way Instagram lets an account owner grant DM access.
// Worst cases covered: typos, personal accounts, links instead of names,
// an account already connected (by you or someone else), lookup down or
// rate-limited (manual confirm still works), and logging in as a different
// account on Instagram's screen (handled after the redirect).
// ─────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, AtSign, BadgeCheck, CircleAlert, Loader2, LockKeyhole, Search, X } from 'lucide-react';
import { AppShell, Notice, Spinner, useRequireSession } from '@/components/app/AppShell';
import { api, ApiError } from '@/lib/app/client';
import { parseInstagramInput } from '@/lib/app/forms';

interface Profile {
  username: string;
  name: string | null;
  avatar: string | null;
  followers: number | null;
  posts: number | null;
  bio: string | null;
}
type Lookup =
  | { status: 'found'; username: string; profile: Profile; connected: 'you' | 'other' | null }
  | { status: 'not_found' | 'unavailable'; username: string; connected: 'you' | 'other' | null }
  | { status: 'invalid' };

const IG_GRADIENT = 'linear-gradient(135deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)';

const fmtNum = (n: number | null) =>
  n === null ? '—' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n);

function Ring({ src, name, size = 'size-16' }: { src: string | null; name: string; size?: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className={`relative grid ${size} flex-none place-items-center rounded-full p-[3px]`} style={{ background: IG_GRADIENT }}>
      <span className="grid size-full place-items-center overflow-hidden rounded-full border-2 border-surface bg-paper-2">
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Instagram CDN image
          <img src={src} alt="" className="size-full object-cover" onError={() => setBroken(true)} />
        ) : (
          <span className="font-display text-xl text-ink-2">{name.slice(0, 1).toUpperCase()}</span>
        )}
      </span>
    </span>
  );
}

export function ConnectClient() {
  const { ready, email } = useRequireSession();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('u') ?? '');
  const [result, setResult] = useState<Lookup | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [going, setGoing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const username = useMemo(() => parseInstagramInput(q), [q]);
  const looksLikeLink = /instagram\.com|instagr\.am/i.test(q);

  // Look up the exact username after a short pause in typing. Older answers
  // that arrive late are ignored (seq), so the card never flickers back.
  useEffect(() => {
    if (!ready) return;
    setError(null);
    if (!q.trim()) { setResult(null); setSearching(false); return; }
    if (!username) { setResult({ status: 'invalid' }); setSearching(false); return; }
    const my = ++seq.current;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await api<Lookup>(`/api/app/instagram/lookup?q=${encodeURIComponent(username)}`);
        if (my === seq.current) setResult(r);
      } catch (e) {
        if (my !== seq.current) return;
        if (e instanceof ApiError && e.status === 429) setError(e.message);
        // Anything else: let them continue by confirming the typed name.
        setResult({ status: 'unavailable', username, connected: null });
      } finally {
        if (my === seq.current) setSearching(false);
      }
    }, 550);
    return () => clearTimeout(t);
  }, [q, username, ready]);

  useEffect(() => { if (ready) inputRef.current?.focus(); }, [ready]);

  async function goToInstagram(u: string) {
    setGoing(true);
    setError(null);
    try {
      const { url } = await api<{ url: string }>('/api/app/instagram/start', { method: 'POST', body: { expect: u } });
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not open Instagram. Please try again.');
      setGoing(false);
    }
  }

  if (!ready) return <AppShell><Spinner /></AppShell>;

  const found = result?.status === 'found' ? result : null;
  const typedName = result && result.status !== 'invalid' ? result.username : username;

  return (
    <AppShell email={email}>
      <Link href="/dashboard" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink"><ArrowLeft className="size-4" aria-hidden="true" /> Dashboard</Link>

      <div className="mx-auto max-w-xl">
        <h1 className="text-center font-display text-3xl leading-tight text-ink sm:text-4xl">Find your Instagram account</h1>
        <p className="mt-2 text-center text-ink-2">Type your username, or paste your profile link.</p>

        {/* The search bar: Instagram-gradient ring that lights up while typing. */}
        <div className="group relative mt-6 rounded-full p-[2px] transition-shadow focus-within:shadow-[0_10px_40px_-12px_rgba(214,41,118,0.45)]" style={{ background: q ? IG_GRADIENT : 'var(--color-line-strong)' }}>
          <div className="flex items-center gap-2 rounded-full bg-surface pl-4 pr-2">
            {searching ? <Loader2 className="size-5 flex-none animate-spin text-ink-3" aria-hidden="true" /> : <Search className="size-5 flex-none text-ink-3" aria-hidden="true" />}
            <span className="flex-none text-lg font-semibold text-ink-3" aria-hidden="true">@</span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => { setQ(e.target.value); setConfirming(null); }}
              placeholder="yourbusiness"
              aria-label="Instagram username or profile link"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              enterKeyHint="search"
              className="h-14 min-w-0 flex-1 bg-transparent text-lg text-ink outline-none placeholder:text-ink-3"
            />
            {q ? (
              <button type="button" onClick={() => { setQ(''); setResult(null); setConfirming(null); inputRef.current?.focus(); }} className="grid size-9 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label="Clear">
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
        {looksLikeLink && username ? <p className="mt-2 text-center text-xs text-ink-3">Got it from the link: @{username}</p> : null}

        <div className="mt-6 min-h-48" aria-live="polite">
          {error ? <Notice tone="error">{error}</Notice> : null}

          {!q ? (
            <div className="rounded-card border border-dashed border-line-strong p-5 text-sm text-ink-2">
              <p className="font-semibold text-ink">Where to find it</p>
              <p className="mt-1">Open Instagram → your profile → the name at the top is your username. Or tap ⋯ → Copy profile URL and paste it here.</p>
            </div>
          ) : null}

          {searching && !found ? (
            <div className="card flex animate-pulse items-center gap-4 p-5">
              <span className="size-16 rounded-full bg-paper-2" />
              <span className="flex-1 space-y-2"><span className="block h-4 w-1/2 rounded bg-paper-2" /><span className="block h-3 w-1/3 rounded bg-paper-2" /></span>
            </div>
          ) : null}

          {result?.status === 'invalid' && !searching ? (
            <Notice tone="warn">Instagram usernames use only letters, numbers, full stops and underscores — no spaces. Check it and try again.</Notice>
          ) : null}

          {found && !confirming ? (
            <div className={`card overflow-hidden transition-opacity ${searching ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-4 p-5">
                <Ring src={found.profile.avatar} name={found.profile.username} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold text-ink">@{found.profile.username} <BadgeCheck className="size-4 flex-none text-positive" aria-label="Professional account" /></p>
                  {found.profile.name ? <p className="truncate text-sm text-ink-2">{found.profile.name}</p> : null}
                  <p className="mt-1 text-sm text-ink-3"><strong className="text-ink">{fmtNum(found.profile.followers)}</strong> followers · <strong className="text-ink">{fmtNum(found.profile.posts)}</strong> posts</p>
                </div>
              </div>
              {found.profile.bio ? <p className="border-t border-line px-5 py-3 text-sm text-ink-2 line-clamp-2">{found.profile.bio}</p> : null}
              <div className="border-t border-line bg-paper-2 p-4">
                {found.connected === 'you' ? (
                  <p className="text-sm text-ink-2">Already connected. <Link className="link" href="/dashboard">Open it in your dashboard</Link>.</p>
                ) : found.connected === 'other' ? (
                  <p className="flex gap-2 text-sm text-ink"><CircleAlert className="mt-0.5 size-4 flex-none text-critical" aria-hidden="true" />This account is connected under another Social ScaleX login. Sign in with that login, or tap Help to move it.</p>
                ) : (
                  <button type="button" onClick={() => setConfirming(found.profile.username)} disabled={searching} className="btn btn-primary btn-lg w-full">
                    Yes, this is my account <ArrowRight className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {result?.status === 'not_found' && !searching && !confirming ? (
            <div className="card p-5">
              <p className="font-semibold text-ink">No professional account called @{result.username}</p>
              <ul className="mt-3 space-y-2 text-sm text-ink-2">
                <li>• <strong>Check the spelling</strong> — every dot and underscore counts.</li>
                <li>• <strong>Personal account?</strong> Automation needs a free Professional account: Instagram → Settings → Account type and tools → Switch to professional account. Then search again.</li>
                <li>• <strong>Just changed your username?</strong> It can take a few minutes to show up.</li>
              </ul>
              <button type="button" onClick={() => setConfirming(result.username)} className="mt-4 text-sm font-semibold text-ink-2 underline underline-offset-4 hover:text-ink">
                I’m sure @{result.username} is right — continue anyway
              </button>
            </div>
          ) : null}

          {result?.status === 'unavailable' && !searching && !confirming ? (
            <div className="card flex flex-wrap items-center gap-4 p-5">
              <Ring src={null} name={result.username} size="size-14" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">@{result.username}</p>
                <p className="text-sm text-ink-3">We couldn’t load the preview right now. Instagram will confirm it on the next screen.</p>
              </div>
              {result.connected === 'you' ? (
                <Link className="link text-sm" href="/dashboard">Already connected</Link>
              ) : result.connected === 'other' ? (
                <p className="w-full text-sm text-critical">Connected under another Social ScaleX login.</p>
              ) : (
                <button type="button" onClick={() => setConfirming(result.username)} className="btn btn-primary w-full sm:w-auto">This is mine <ArrowRight className="size-4" aria-hidden="true" /></button>
              )}
            </div>
          ) : null}

          {/* Confirm sheet */}
          {confirming ? (
            <div className="card overflow-hidden" role="dialog" aria-labelledby="confirm-title">
              <div className="flex items-center gap-4 p-5">
                <Ring src={found?.profile.username === confirming ? found.profile.avatar : null} name={confirming} />
                <div className="min-w-0">
                  <p id="confirm-title" className="font-display text-2xl leading-tight text-ink">Connect @{confirming}?</p>
                  <p className="text-sm text-ink-2">Instagram will ask you to log in to confirm it’s yours.</p>
                </div>
              </div>
              <ol className="grid gap-2 border-t border-line px-5 py-4 text-sm text-ink-2">
                <li><strong className="text-ink">1.</strong> Log in as <strong className="text-ink">@{confirming}</strong> on Instagram’s screen.</li>
                <li><strong className="text-ink">2.</strong> Tap <strong className="text-ink">Allow</strong> and keep all permissions on.</li>
                <li><strong className="text-ink">3.</strong> You come straight back here to set up your DM.</li>
              </ol>
              <div className="grid gap-2 border-t border-line bg-paper-2 p-4 sm:grid-cols-[1fr_auto]">
                <button type="button" onClick={() => goToInstagram(confirming)} disabled={going} className="btn btn-primary btn-lg w-full">
                  {going ? 'Opening Instagram…' : 'Continue to Instagram'} {!going ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
                </button>
                <button type="button" onClick={() => setConfirming(null)} className="btn btn-secondary btn-lg">Back</button>
              </div>
              <p className="flex items-start gap-2 px-5 pb-4 pt-3 text-xs text-ink-3">
                <LockKeyhole className="mt-0.5 size-3.5 flex-none" aria-hidden="true" />
                Official Instagram login. We never see your password, and you can remove access any time.
              </p>
            </div>
          ) : null}
        </div>

        {typedName && !found && !confirming && result?.status !== 'invalid' && !searching ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-3"><AtSign className="size-3.5" aria-hidden="true" /> Exact username only — Instagram doesn’t offer partial-name search.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
