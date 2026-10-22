'use client';
// ─────────────────────────────────────────────────────────────────────
// Step 3: build an automation. One page, four short cards, sensible
// defaults already filled in, live DM preview. Used for new and edit.
// ─────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ImageOff, Loader2, Plus, X } from 'lucide-react';
import { AppShell, Notice, Spinner, Stepper, useRequireSession } from '@/components/app/AppShell';
import { api, ApiError, type AccountDetail, type Automation, type MediaItem } from '@/lib/app/client';
import { AutomationInput, cleanKeywords, LIMITS, personalize } from '@/lib/app/rules';

const KEYWORD_IDEAS = ['PRICE', 'LINK', 'INFO', 'DETAILS', 'BOOK'];
const DEFAULT_REPLIES = ['Sent! Check your DMs 📩', 'Done {username}, check your inbox 👍', 'Just messaged you ✅'];
const DEFAULT_DM = 'Hi {username}! Thanks for your comment 🙌\n\nHere are the details you asked for:\n👉 https://\n\nAny questions? Just reply here.';

type Media = { id: string; thumb: string | null; caption: string | null; permalink: string | null };

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6" aria-labelledby={`s${n}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-7 flex-none place-items-center rounded-full bg-ink font-display text-sm text-white">{n}</span>
        <div className="min-w-0 flex-1">
          <h2 id={`s${n}`} className="text-lg font-semibold text-ink">{title}</h2>
          {hint ? <p className="mt-0.5 text-sm text-ink-3">{hint}</p> : null}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Choice({ checked, onSelect, title, desc, name }: { checked: boolean; onSelect: () => void; title: string; desc: string; name: string }) {
  return (
    <label className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors ${checked ? 'border-ink bg-paper-2' : 'border-line hover:border-line-strong'}`}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="mt-1 size-4 accent-[var(--color-ink)]" />
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-ink-3">{desc}</span>
      </span>
    </label>
  );
}

function Thumb({ m, size = 'size-full' }: { m: Media; size?: string }) {
  const [broken, setBroken] = useState(false);
  if (!m.thumb || broken) {
    return <span className={`grid ${size} place-items-center bg-paper-2 text-ink-3`}><ImageOff className="size-5" aria-hidden="true" /></span>;
  }
  // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Instagram CDN image
  return <img src={m.thumb} alt="" loading="lazy" onError={() => setBroken(true)} className={`${size} object-cover`} />;
}

function MediaPicker({ accountId, selected, onChange }: { accountId: string; selected: Media[]; onChange: (m: Media[]) => void }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (after?: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await api<{ items: MediaItem[]; next: string | null }>(`/api/app/accounts/${accountId}/media${after ? `?after=${encodeURIComponent(after)}` : ''}`);
      setItems((prev) => (after ? [...prev, ...r.items.filter((x) => !prev.some((p) => p.id === x.id))] : r.items));
      setNext(r.next);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load your posts.');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => { void load(); }, [load]);

  const isOn = (id: string) => selected.some((s) => s.id === id);
  const toggle = (m: MediaItem) => {
    if (isOn(m.id)) onChange(selected.filter((s) => s.id !== m.id));
    else if (selected.length < LIMITS.media) onChange([...selected, { id: m.id, thumb: m.thumb, caption: m.caption, permalink: m.permalink }]);
  };

  return (
    <div className="mt-4">
      {error ? <Notice tone="error">{error} <button type="button" className="link" onClick={() => load()}>Try again</button></Notice> : null}
      {!loading && !error && items.length === 0 ? <p className="text-sm text-ink-3">No posts found on this account yet. Choose “All posts” instead — it covers posts you publish later too.</p> : null}
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((m) => {
          const on = isOn(m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => toggle(m)}
                aria-pressed={on}
                aria-label={`${m.type}${m.caption ? `: ${m.caption.slice(0, 60)}` : ''}`}
                className={`relative block aspect-[4/5] w-full overflow-hidden rounded-xl ring-2 transition ${on ? 'ring-ink' : 'ring-transparent hover:ring-line-strong'}`}
              >
                <Thumb m={m} />
                {m.type === 'reel' ? <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/75 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Reel</span> : null}
                <span className={`absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full border-2 border-white ${on ? 'bg-ink text-white' : 'bg-black/25'}`}>
                  {on ? <Check className="size-3.5" aria-hidden="true" /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {loading ? <p className="mt-3 flex items-center gap-2 text-sm text-ink-3"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading your posts…</p> : null}
      {next && !loading ? <button type="button" className="btn btn-secondary mt-4 w-full" onClick={() => load(next)}>Show older posts</button> : null}
    </div>
  );
}

function ChipInput({ values, onChange, placeholder, max }: { values: string[]; onChange: (v: string[]) => void; placeholder: string; max: number }) {
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean).map((s) => s.slice(0, LIMITS.keywordLength));
    if (!parts.length) return;
    onChange(cleanKeywords([...values, ...parts]).slice(0, max));
    setDraft('');
  };
  return (
    <div>
      <div className="field flex min-h-12 flex-wrap items-center gap-2 py-2">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`} className="-mr-1 rounded-full p-0.5 hover:bg-white/20"><X className="size-3.5" /></button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); }
            if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={() => add(draft)}
          placeholder={values.length ? 'Add another…' : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent text-base outline-none"
          aria-label="Keyword"
          enterKeyHint="done"
        />
      </div>
    </div>
  );
}

function autoName(scope: 'all' | 'selected', count: number, mode: 'any' | 'keywords', kws: string[]): string {
  const what = mode === 'keywords' ? (kws.slice(0, 2).join(', ') + (kws.length > 2 ? ` +${kws.length - 2}` : '') || 'Keywords') : 'Any comment';
  const where = scope === 'all' ? 'All posts' : `${count} post${count === 1 ? '' : 's'}`;
  return `${what} · ${where}`.slice(0, LIMITS.nameLength);
}

export function BuilderClient({ accountId, automationId }: { accountId: string; automationId?: string }) {
  const { ready, email } = useRequireSession();
  const router = useRouter();
  const params = useSearchParams();
  const [detail, setDetail] = useState<AccountDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [scope, setScope] = useState<'all' | 'selected'>('all');
  const [media, setMedia] = useState<Media[]>([]);
  const [mode, setMode] = useState<'any' | 'keywords'>('keywords');
  const [keywords, setKeywords] = useState<string[]>(['PRICE']);
  const [replyOn, setReplyOn] = useState(true);
  const [replies, setReplies] = useState<string[]>(DEFAULT_REPLIES);
  const [dm, setDm] = useState(DEFAULT_DM);
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!ready) return;
    api<AccountDetail>(`/api/app/accounts/${accountId}`)
      .then((d) => {
        setDetail(d);
        if (automationId) {
          const a = d.automations.find((x: Automation) => x.id === automationId);
          if (!a) { setLoadError('This automation no longer exists.'); return; }
          setScope(a.media_scope);
          setMedia(a.media_meta ?? []);
          setMode(a.trigger_mode);
          setKeywords(a.keywords);
          setReplyOn(a.public_replies.length > 0);
          setReplies(a.public_replies.length ? a.public_replies : DEFAULT_REPLIES);
          setDm(a.dm_text);
          setName(a.name);
          setNameTouched(true);
        }
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.message : 'Could not load this account.'));
  }, [ready, accountId, automationId]);

  // Warn before leaving with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const touch = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true); };
  const finalName = nameTouched && name.trim() ? name.trim() : autoName(scope, media.length, mode, keywords);
  const payload = useMemo(
    () => ({
      name: finalName,
      mediaScope: scope,
      media: scope === 'selected' ? media : [],
      triggerMode: mode,
      keywords: mode === 'keywords' ? keywords : [],
      publicReplies: replyOn ? replies.map((r) => r.trim()).filter(Boolean) : [],
      dmText: dm.trim(),
    }),
    [finalName, scope, media, mode, keywords, replyOn, replies, dm],
  );
  const check = AutomationInput.safeParse(payload);
  // A bare "https://" left from the template would send a broken link.
  const dmHasPlaceholderLink = /https?:\/\/(?=\s|$)/.test(dm);
  const problem = dmHasPlaceholderLink
    ? 'Replace “https://” in the DM with your real link, or delete it.'
    : check.success ? null : check.error.issues[0]?.message ?? 'Please complete the form.';

  async function save() {
    if (problem) { setError(problem); return; }
    setSaving(true);
    setError(null);
    try {
      if (automationId) await api(`/api/app/automations/${automationId}`, { method: 'PATCH', body: payload });
      else await api(`/api/app/accounts/${accountId}/automations`, { method: 'POST', body: payload });
      setDirty(false);
      const paid = detail?.billing?.active;
      router.push(paid ? `/dashboard/${accountId}?saved=1` : `/dashboard/${accountId}/activate`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  if (!ready || (!detail && !loadError)) return <AppShell email={email}><Spinner /></AppShell>;
  if (loadError || !detail) return <AppShell email={email}><Notice tone="error">{loadError}</Notice><Link className="link" href="/dashboard">Back to dashboard</Link></AppShell>;

  const paid = Boolean(detail.billing?.active);
  const username = detail.account.username;
  const previewUser = 'riya.sharma';

  return (
    <AppShell email={email}>
      {!paid && !automationId ? <Stepper at={2} /> : null}
      {params.get('connected') ? <Notice tone="ok">@{username} is connected. Now tell us what to send.</Notice> : null}
      <Link href={`/dashboard/${accountId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink"><ArrowLeft className="size-4" aria-hidden="true" /> @{username}</Link>
      <h1 className="font-display text-3xl leading-tight text-ink sm:text-4xl">{automationId ? 'Edit automation' : 'Set up your automation'}</h1>
      <p className="mt-1 text-ink-2">We filled in a good starting point. Change anything you like.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="grid gap-5">
          <Section n={1} title="Which posts?">
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice name="scope" checked={scope === 'all'} onSelect={() => touch(setScope)('all')} title="All posts & Reels" desc="Including ones you post later" />
              <Choice name="scope" checked={scope === 'selected'} onSelect={() => touch(setScope)('selected')} title="Only posts I pick" desc={media.length ? `${media.length} selected` : 'Choose one or more'} />
            </div>
            {scope === 'selected' ? <MediaPicker accountId={accountId} selected={media} onChange={touch(setMedia)} /> : null}
          </Section>

          <Section n={2} title="Which comments?">
            <div className="grid gap-3 sm:grid-cols-2">
              <Choice name="mode" checked={mode === 'keywords'} onSelect={() => touch(setMode)('keywords')} title="Comments with a keyword" desc="e.g. someone types PRICE" />
              <Choice name="mode" checked={mode === 'any'} onSelect={() => touch(setMode)('any')} title="Every comment" desc="Anyone who comments gets the DM" />
            </div>
            {mode === 'keywords' ? (
              <div className="mt-4">
                <ChipInput values={keywords} onChange={touch(setKeywords)} placeholder="Type a keyword and press Enter" max={LIMITS.keywords} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {KEYWORD_IDEAS.filter((k) => !keywords.some((x) => x.toLowerCase() === k.toLowerCase())).map((k) => (
                    <button key={k} type="button" onClick={() => touch(setKeywords)(cleanKeywords([...keywords, k]))} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-sm text-ink-2 hover:border-ink hover:text-ink">
                      <Plus className="size-3.5" aria-hidden="true" /> {k}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-ink-3">Capital letters don’t matter. “price” also matches “Price?” and “price pls”, but not “priceless”. Hindi and emoji keywords work too.</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-ink-3">Each person gets at most one DM per post per day, even if they comment many times.</p>
            )}
          </Section>

          <Section n={3} title="Reply under their comment" hint="Optional. Shows others that the DM works, which brings more comments.">
            <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink">
              <input type="checkbox" checked={replyOn} onChange={(e) => touch(setReplyOn)(e.target.checked)} className="size-4 accent-[var(--color-ink)]" />
              Also reply publicly
            </label>
            {replyOn ? (
              <div className="mt-4 grid gap-2">
                {replies.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className="field flex-1"
                      value={r}
                      maxLength={LIMITS.replyLength}
                      onChange={(e) => touch(setReplies)(replies.map((x, j) => (j === i ? e.target.value : x)))}
                      aria-label={`Public reply ${i + 1}`}
                    />
                    {replies.length > 1 ? (
                      <button type="button" onClick={() => touch(setReplies)(replies.filter((_, j) => j !== i))} className="grid size-10 place-items-center rounded-full text-ink-3 hover:bg-paper-2 hover:text-ink" aria-label="Remove reply"><X className="size-4" /></button>
                    ) : null}
                  </div>
                ))}
                {replies.length < LIMITS.replies ? (
                  <button type="button" onClick={() => touch(setReplies)([...replies, ''])} className="inline-flex items-center gap-1 self-start text-sm font-semibold text-ink-2 hover:text-ink"><Plus className="size-4" aria-hidden="true" /> Add a variation</button>
                ) : null}
                <p className="text-xs text-ink-3">We rotate between these so the replies don’t all look the same. <code className="rounded bg-paper-2 px-1">{'{username}'}</code> becomes their @name.</p>
              </div>
            ) : null}
          </Section>

          <Section n={4} title="The DM they receive">
            <textarea
              className="field min-h-44 w-full resize-y leading-relaxed"
              value={dm}
              maxLength={LIMITS.dmLength}
              onChange={(e) => touch(setDm)(e.target.value)}
              aria-label="DM message"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
              <button type="button" onClick={() => touch(setDm)(`${dm}{username}`)} className="rounded-full border border-line px-3 py-1 font-semibold text-ink-2 hover:border-ink hover:text-ink">+ Insert {'{username}'}</button>
              <span>{dm.length} / {LIMITS.dmLength}</span>
            </div>
            {dmHasPlaceholderLink ? <p className="mt-3 rounded-xl bg-coral-tint px-3 py-2 text-sm text-ink">Replace <strong>https://</strong> with your real link (website, WhatsApp, catalogue or booking page).</p> : null}
          </Section>

          <details className="text-sm text-ink-2">
            <summary className="cursor-pointer font-semibold text-ink">Name this automation (optional)</summary>
            <input className="field mt-3 w-full" value={nameTouched ? name : finalName} maxLength={LIMITS.nameLength} onChange={(e) => { setName(e.target.value); setNameTouched(true); setDirty(true); }} aria-label="Automation name" />
          </details>
        </div>

        <aside className="lg:sticky lg:top-6" aria-label="Preview">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">Preview</p>
          <div className="mt-3 rounded-[1.75rem] border border-line bg-surface p-4 shadow-soft">
            <p className="text-xs text-ink-3">Comment on your post</p>
            <p className="mt-1 text-sm"><strong className="text-ink">{previewUser}</strong> <span className="text-ink-2">{mode === 'keywords' ? keywords[0] ?? 'PRICE' : 'Love this! How much?'}</span></p>
            {replyOn && replies[0]?.trim() ? (
              <p className="mt-2 border-l-2 border-line pl-3 text-sm"><strong className="text-ink">{username}</strong> <span className="text-ink-2">{personalize(replies[0], previewUser)}</span></p>
            ) : null}
            <div className="my-4 h-px bg-line" />
            <p className="text-xs text-ink-3">DM from @{username}</p>
            <p className="mt-2 whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-paper-2 px-4 py-3 text-sm text-ink">{personalize(dm, previewUser) || '…'}</p>
          </div>
          <div className="mt-5 hidden lg:block">
            {error ? <Notice tone="error">{error}</Notice> : null}
            <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-lg w-full">
              {saving ? 'Saving…' : automationId ? 'Save changes' : paid ? 'Save & switch on' : 'Save & continue'} {!saving ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
            </button>
            {!paid && !automationId ? <p className="mt-2 text-center text-xs text-ink-3">Next: pay ₹99 to switch it on.</p> : null}
            {problem && !error ? <p className="mt-2 text-center text-xs text-critical">{problem}</p> : null}
          </div>
        </aside>
      </div>

      {/* Phones: the save button stays in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 p-3 lg:hidden">
        {error ? <p className="mb-2 text-center text-sm text-critical">{error}</p> : problem ? <p className="mb-2 text-center text-xs text-critical">{problem}</p> : null}
        <button type="button" onClick={save} disabled={saving} className="btn btn-primary btn-lg w-full">
          {saving ? 'Saving…' : automationId ? 'Save changes' : paid ? 'Save & switch on' : 'Save & continue to payment'} {!saving ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
        </button>
      </div>
    </AppShell>
  );
}
