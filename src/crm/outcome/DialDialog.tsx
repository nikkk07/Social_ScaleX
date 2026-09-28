'use client';
// Desktop dialling: scan the QR with a phone (it opens the dialler with the
// number filled in), or use this computer's calling app. Then log the result.
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Phone } from 'lucide-react';
import { formatPhone } from '@/lib/crm/normalize';
import { Modal, Btn } from '../ui/Modal';
import type { PendingAttempt } from '../data/hooks';

export function DialDialog({ attempt, onLog, onClose }: {
  attempt: PendingAttempt; onLog: () => void; onClose: () => void;
}) {
  const [svg, setSvg] = useState<string | null>(null);
  const tel = `tel:${attempt.phone_e164 ?? ''}`;

  useEffect(() => {
    let alive = true;
    QRCode.toString(tel, { type: 'svg', margin: 1, width: 188, errorCorrectionLevel: 'M' })
      .then((s) => { if (alive) setSvg(s); })
      .catch(() => { if (alive) setSvg(null); });
    return () => { alive = false; };
  }, [tel]);

  return (
    <Modal
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={`Call ${attempt.lead?.brand_name ?? 'lead'}`}
      description="Scan with your phone to dial, then come back and log what happened."
      size="sm"
      closeLabel="Log later"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Log later</Btn>
          <Btn onClick={onLog}>Log the outcome</Btn>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className="rounded-xl border border-border bg-white p-2"
          role="img"
          aria-label={`QR code that dials ${formatPhone(attempt.phone_e164)}`}
          // The SVG is generated locally by the qrcode library from a tel: URI
          // we built ourselves — no user HTML is ever injected here.
          dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
          style={{ width: 204, height: 204 }}
        />
        <p className="text-lg font-semibold tabular">{formatPhone(attempt.phone_e164)}</p>
        <a href={tel} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
          <Phone className="size-4" aria-hidden="true" /> Call from this computer
        </a>
      </div>
    </Modal>
  );
}
