'use client';
// Admin import from CSV or Excel (.xlsx). Parsing happens in the browser;
// the server (import_leads) re-validates every row, de-duplicates against
// existing leads by Instagram handle and phone, and reports what it skipped.
import React, { useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { Modal, Btn } from '../ui/Modal';
import { inputClass } from '../ui/kit';
import { asJson, rpc } from '../lib/api';
import { friendlyError } from '../lib/errors';
import { isEmail, normalizeInstagram, normalizePhone } from '@/lib/crm/normalize';

type FieldKey = 'brand_name' | 'contact_name' | 'phone' | 'email' | 'instagram' | 'address' | 'notes';
const FIELDS: { key: FieldKey; label: string; guesses: string[]; required?: boolean }[] = [
  { key: 'brand_name', label: 'Brand / business name', guesses: ['brand', 'brand name', 'brand_name', 'business', 'company', 'name', 'store'], required: true },
  { key: 'contact_name', label: 'Contact person', guesses: ['contact', 'contact name', 'contact_name', 'person', 'owner', 'full name'] },
  { key: 'phone', label: 'Phone', guesses: ['phone', 'mobile', 'phone number', 'contact number', 'whatsapp', 'number', 'tel'] },
  { key: 'email', label: 'Email', guesses: ['email', 'e-mail', 'mail', 'email address'] },
  { key: 'instagram', label: 'Instagram', guesses: ['instagram', 'insta', 'ig', 'handle', 'instagram handle', 'instagram_username'] },
  { key: 'address', label: 'City / address', guesses: ['address', 'city', 'location', 'area'] },
  { key: 'notes', label: 'Notes', guesses: ['notes', 'note', 'remarks', 'comment', 'comments'] },
];
const MAX_ROWS = 5000;
const CHUNK = 500;

type Row = Record<string, string>;

async function parseFile(file: File): Promise<{ headers: string[]; rows: Row[] }> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import('read-excel-file/browser');
    const data = await readSheet(file);
    const [head, ...body] = data;
    const headers = (head ?? []).map((h, i) => String(h ?? '').trim() || `Column ${i + 1}`);
    const rows = body
      .map((r) => Object.fromEntries(headers.map((h, i) => [h, cellText(r[i])])))
      .filter((r) => Object.values(r).some((v) => v.trim() !== ''));
    return { headers, rows };
  }
  if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') {
    throw new Error('Use a .csv or .xlsx file. For old .xls files, open them in Excel and save as .xlsx.');
  }
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h, i) => h.trim() || `Column ${i + 1}`,
      complete: (res) => {
        if (res.errors.length && !res.data.length) reject(new Error('Couldn’t read that CSV file.'));
        else resolve({ headers: res.meta.fields ?? [], rows: res.data });
      },
      error: () => reject(new Error('Couldn’t read that CSV file.')),
    });
  });
}

function cellText(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  return String(v);
}

function guess(headers: string[]): Record<FieldKey, string> {
  const lower = headers.map((h) => h.toLowerCase().trim());
  const out = {} as Record<FieldKey, string>;
  const used = new Set<number>();
  for (const f of FIELDS) {
    const i = lower.findIndex((h, idx) => !used.has(idx) && f.guesses.includes(h));
    out[f.key] = i >= 0 ? (headers[i] as string) : '';
    if (i >= 0) used.add(i);
  }
  return out;
}

export function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [map, setMap] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ inserted: number; skipped: { row: number; reason: string }[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function pick(f: File | undefined) {
    setErr(null);
    setResult(null);
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setErr('That file is larger than 10 MB.'); return; }
    try {
      const parsed = await parseFile(f);
      if (!parsed.rows.length) { setErr('No rows found in that file.'); return; }
      if (parsed.rows.length > MAX_ROWS) { setErr(`That file has ${parsed.rows.length} rows; the limit is ${MAX_ROWS} per import.`); return; }
      setFile(f);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMap(guess(parsed.headers));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Couldn’t read that file.');
    }
  }

  const mapped = useMemo(() => rows.map((r) => {
    const v = (k: FieldKey) => (map[k] ? (r[map[k]] ?? '').toString().trim() : '');
    return {
      brand_name: v('brand_name'), contact_name: v('contact_name'), phone: v('phone'), email: v('email'),
      instagram: v('instagram'), address: v('address'), notes: v('notes'),
    };
  }), [rows, map]);

  const localIssues = useMemo(() => {
    let missingBrand = 0; let badPhone = 0; let badEmail = 0; let badIg = 0;
    for (const m of mapped) {
      if (!m.brand_name) missingBrand++;
      if (m.phone && !normalizePhone(m.phone)) badPhone++;
      if (m.email && !isEmail(m.email)) badEmail++;
      if (m.instagram && !normalizeInstagram(m.instagram)) badIg++;
    }
    return { missingBrand, badPhone, badEmail, badIg };
  }, [mapped]);

  async function run() {
    if (!map.brand_name) { setErr('Choose which column holds the brand name.'); return; }
    setBusy(true);
    setErr(null);
    let inserted = 0;
    const skipped: { row: number; reason: string }[] = [];
    try {
      for (let i = 0; i < mapped.length; i += CHUNK) {
        const chunk = mapped.slice(i, i + CHUNK).map((m) => ({ ...m, instagram: m.instagram || null }));
        const res = (await rpc('import_leads', { p_rows: asJson(chunk) })) as { inserted: number; skipped: { row: number; reason: string }[] };
        inserted += res.inserted;
        skipped.push(...res.skipped.map((s) => ({ row: s.row + i + 1, reason: s.reason }))); // +1 for the header row
        setProgress(Math.min(mapped.length, i + CHUNK));
      }
      setResult({ inserted, skipped });
      if (inserted) toast.success(`Imported ${inserted} lead${inserted === 1 ? '' : 's'} into the unassigned pool.`);
      onDone();
    } catch (e) {
      setErr(friendlyError(e));
      if (inserted) { setResult({ inserted, skipped }); onDone(); }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onOpenChange={(o) => { if (!o && !busy) onClose(); }} size="lg" title="Import leads"
      description="CSV or Excel (.xlsx), up to 5,000 rows. Imported leads join the unassigned pool for daily top-ups."
      footer={result ? <Btn onClick={onClose}>Done</Btn> : (
        <>
          <Btn variant="secondary" onClick={onClose} disabled={busy}>Cancel</Btn>
          <Btn onClick={run} disabled={busy || !rows.length}>{busy ? `Importing… ${progress}/${mapped.length}` : `Import ${rows.length || ''} rows`}</Btn>
        </>
      )}>
      {result ? (
        <div className="space-y-3">
          <p className="text-sm"><strong>{result.inserted}</strong> imported · <strong>{result.skipped.length}</strong> skipped.</p>
          {result.skipped.length ? (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <caption className="sr-only">Skipped rows</caption>
                <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground"><tr><th scope="col" className="px-3 py-1.5">Row</th><th scope="col" className="px-3 py-1.5">Why</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {result.skipped.map((s) => <tr key={s.row}><td className="px-3 py-1.5 tabular">{s.row}</td><td className="px-3 py-1.5">{s.reason}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only" id="import-file" onChange={(e) => void pick(e.target.files?.[0])} />
            <label htmlFor="import-file"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-8 text-center text-sm hover:bg-muted has-[:focus-visible]:ring-2">
              {file ? <FileSpreadsheet className="size-6 text-primary" aria-hidden="true" /> : <Upload className="size-6 text-muted-foreground" aria-hidden="true" />}
              <span className="font-medium">{file ? file.name : 'Choose a file'}</span>
              <span className="text-xs text-muted-foreground">{file ? `${rows.length} rows · choose another to replace` : 'First row must be the column names'}</span>
            </label>
          </div>
          {err ? <p role="alert" className="text-sm font-medium text-destructive">{err}</p> : null}

          {rows.length ? (
            <>
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-2 text-sm font-medium">Match your columns</legend>
                {FIELDS.map((f) => (
                  <label key={f.key} className="block space-y-1 text-sm">
                    <span>{f.label}{f.required ? <span className="text-destructive" aria-hidden="true"> *</span> : null}</span>
                    <select value={map[f.key] ?? ''} onChange={(e) => setMap({ ...map, [f.key]: e.target.value })} className={inputClass}>
                      <option value="">— not in file —</option>
                      {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </label>
                ))}
              </fieldset>
              <ul className="space-y-1 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                <li>Duplicates of existing leads (same Instagram handle or phone) are skipped automatically.</li>
                {localIssues.missingBrand ? <li>{localIssues.missingBrand} row(s) have no brand name and will be skipped.</li> : null}
                {localIssues.badPhone ? <li>{localIssues.badPhone} row(s) have a phone number that isn’t valid and will be skipped.</li> : null}
                {localIssues.badEmail ? <li>{localIssues.badEmail} row(s) have an invalid email and will be skipped.</li> : null}
                {localIssues.badIg ? <li>{localIssues.badIg} Instagram value(s) can’t be read and will be left empty.</li> : null}
              </ul>
            </>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
