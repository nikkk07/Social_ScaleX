// CSV/Excel import dialog with preview and field mapping
'use client';

import React, { useCallback, useState, useRef } from 'react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { Upload, X, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface ParsedRow {
  [key: string]: string;
}

interface ImportStats {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: ParsedRow }>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COLUMN_MAPPINGS = {
  brand_name: ['name', 'brand', 'brand_name', 'company', 'business'],
  phone: ['phone', 'mobile', 'contact', 'phone_number', 'tel'],
  email: ['email', 'mail', 'e-mail'],
  instagram_username: ['instagram', 'insta', 'ig', 'handle', 'instagram_username'],
  address: ['address', 'location', 'city'],
};

function normalizePhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.trim().replace(/\s+/g, '').replace(/^0+/, '');
  if (cleaned.startsWith('+91')) return cleaned;
  if (cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  return cleaned;
}

function detectColumn(
  headers: string[],
  possibleNames: string[]
): string | null {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const possible of possibleNames) {
    const idx = lowerHeaders.indexOf(possible);
    if (idx !== -1) return headers[idx] || null;
  }
  return null;
}

export function LeadImportDialog({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<ImportStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setMapping({});
    setStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file.');
      return;
    }

    setFile(selectedFile);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          toast.error('Failed to parse file. Please check the format.');
          console.error('Parse errors:', result.errors);
          return;
        }

        const data = result.data as ParsedRow[];
        if (data.length === 0) {
          toast.error('The file is empty.');
          return;
        }

        const fileHeaders = result.meta.fields || [];
        setHeaders(fileHeaders);
        setRows(data);

        // Auto-detect column mapping
        const autoMapping: Record<string, string> = {};
        autoMapping.brand_name = detectColumn(fileHeaders, COLUMN_MAPPINGS.brand_name) || '';
        autoMapping.phone = detectColumn(fileHeaders, COLUMN_MAPPINGS.phone) || '';
        autoMapping.email = detectColumn(fileHeaders, COLUMN_MAPPINGS.email) || '';
        autoMapping.instagram_username = detectColumn(fileHeaders, COLUMN_MAPPINGS.instagram_username) || '';
        autoMapping.address = detectColumn(fileHeaders, COLUMN_MAPPINGS.address) || '';
        
        setMapping(autoMapping);
        setStep('preview');
      },
      error: (error) => {
        toast.error(`Parse error: ${error.message}`);
      },
    });
  }, []);

  const handleImport = useCallback(async () => {
    if (!mapping.brand_name) {
      toast.error('Brand name field is required.');
      return;
    }

    setStep('importing');
    const importStats: ImportStats = {
      total: rows.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    // Get current user for created_by field
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to import leads.');
      setStep('preview');
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      try {
        const brandName = row[mapping.brand_name]?.trim();
        if (!brandName) {
          importStats.failed++;
          importStats.errors.push({
            row: i + 1,
            error: 'Missing brand name',
            data: row,
          });
          continue;
        }

        const leadData: {
          brand_name: string;
          source: string;
          created_by: string;
          phone?: string;
          email?: string;
          address?: string;
          status?: string;
        } = {
          brand_name: brandName,
          source: 'import',
          created_by: user.id,
          status: 'pending',
        };

        // Add phone if exists
        if (mapping.phone && row[mapping.phone]) {
          const phoneValue = row[mapping.phone];
          if (phoneValue) {
            const phoneE164 = normalizePhone(phoneValue);
            if (phoneE164) leadData.phone = phoneE164;
          }
        }

        // Add email if exists
        if (mapping.email && row[mapping.email]) {
          const emailValue = row[mapping.email];
          if (emailValue) leadData.email = emailValue.trim();
        }

        if (mapping.instagram_username && row[mapping.instagram_username]) {
          // Store in address or notes since instagram_username column doesn't exist
          const ig = row[mapping.instagram_username];
          if (ig) {
            const trimmed = ig.trim();
            if (trimmed && !leadData.address) {
              leadData.address = `IG: ${trimmed}`;
            }
          }
        }

        if (mapping.address && row[mapping.address]) {
          const addrValue = row[mapping.address];
          if (addrValue) {
            const addr = addrValue.trim();
            if (leadData.address && leadData.address.startsWith('IG:')) {
              leadData.address = `${leadData.address} | ${addr}`;
            } else {
              leadData.address = addr;
            }
          }
        }

        // Insert lead (simplified - single table insert)
        const { data: insertedLead, error: leadError } = await supabase
          .from('leads')
          .insert(leadData)
          .select('id')
          .single();

        if (leadError) {
          importStats.failed++;
          importStats.errors.push({
            row: i + 1,
            error: leadError.message,
            data: row,
          });
          continue;
        }

        importStats.successful++;
      } catch (error) {
        importStats.failed++;
        importStats.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: row,
        });
      }
    }

    setStats(importStats);
    setStep('complete');

    if (importStats.successful > 0) {
      toast.success(`Imported ${importStats.successful} lead${importStats.successful === 1 ? '' : 's'} successfully!`);
      onSuccess();
    }
  }, [rows, mapping, onSuccess]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="crm-root dark max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV/Excel</DialogTitle>
          <DialogDescription>
            Upload a file containing your leads. We&apos;ll help you map the columns.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-[var(--border)] p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer flex-col items-center gap-3"
              >
                <Upload size={48} className="text-white/40" />
                <div>
                  <p className="text-sm font-medium text-white/90">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    CSV or Excel files (up to 10MB)
                  </p>
                </div>
              </label>
            </div>
            <div className="rounded-lg bg-[var(--accent)] p-4 text-sm text-white/70">
              <p className="font-medium text-white/90 mb-2">Expected columns:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Brand Name</strong> (required)</li>
                <li>Phone (optional)</li>
                <li>Email (optional)</li>
                <li>Instagram Handle (optional)</li>
                <li>Address (optional)</li>
              </ul>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white/90">{file?.name}</p>
                  <p className="text-sm text-white/50">{rows.length} rows found</p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="text-white/60 hover:text-white/90"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-white/90">Map your columns:</p>
                
                <div className="grid gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-white/60">
                      Brand Name <span className="text-[var(--destructive)]">*</span>
                    </label>
                    <select
                      value={mapping.brand_name}
                      onChange={(e) => setMapping({ ...mapping, brand_name: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)]"
                    >
                      <option value="">-- Select column --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">Phone</label>
                    <select
                      value={mapping.phone}
                      onChange={(e) => setMapping({ ...mapping, phone: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)]"
                    >
                      <option value="">-- Skip --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">Email</label>
                    <select
                      value={mapping.email}
                      onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)]"
                    >
                      <option value="">-- Skip --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">Instagram Handle</label>
                    <select
                      value={mapping.instagram_username}
                      onChange={(e) => setMapping({ ...mapping, instagram_username: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)]"
                    >
                      <option value="">-- Skip --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-white/60">Address</label>
                    <select
                      value={mapping.address}
                      onChange={(e) => setMapping({ ...mapping, address: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)]"
                    >
                      <option value="">-- Skip --</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 max-h-48 overflow-y-auto rounded border border-[var(--border)]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[var(--card)] border-b border-[var(--border)]">
                    <tr>
                      {headers.slice(0, 5).map((h) => (
                        <th key={h} className="px-2 py-1 text-left text-white/60 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-[var(--border)]">
                        {headers.slice(0, 5).map((h) => (
                          <td key={h} className="px-2 py-1 text-white/80">
                            {row[h] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!mapping.brand_name}
                className="rounded-lg bg-[var(--color-violet-cta)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Import {rows.length} Lead{rows.length === 1 ? '' : 's'}
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 size={48} className="animate-spin text-[var(--color-violet-light)] mb-4" />
            <p className="text-sm text-white/70">Importing leads...</p>
          </div>
        )}

        {step === 'complete' && stats && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
                <p className="text-2xl font-bold text-white/90">{stats.total}</p>
                <p className="text-xs text-white/60">Total</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--color-emerald)]">{stats.successful}</p>
                <p className="text-xs text-white/60">Successful</p>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--destructive)]">{stats.failed}</p>
                <p className="text-xs text-white/60">Failed</p>
              </div>
            </div>

            {stats.errors.length > 0 && (
              <div className="rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 p-4 max-h-64 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-[var(--destructive)]" />
                  <p className="text-sm font-medium text-[var(--destructive)]">
                    Errors ({stats.errors.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {stats.errors.map((err, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-white/60">Row {err.row}:</span>{' '}
                      <span className="text-[var(--destructive)]">{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.successful > 0 && (
              <div className="rounded-lg border border-[var(--color-emerald)]/30 bg-[var(--color-emerald)]/10 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[var(--color-emerald)]" />
                  <p className="text-sm text-[var(--color-emerald)]">
                    Successfully imported {stats.successful} lead{stats.successful === 1 ? '' : 's'}!
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-[var(--color-violet-cta)] px-4 py-2 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
