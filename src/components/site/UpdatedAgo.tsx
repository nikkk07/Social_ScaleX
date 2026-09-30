'use client';
import React, { useEffect, useState } from 'react';
import { formatDay } from '@/lib/dates';

const DAY = 86_400_000;
/** Calendar day in India, so "today" flips at IST midnight for every visitor. */
const istDay = (d: Date) => Math.floor((d.getTime() + 5.5 * 3_600_000) / DAY);

/**
 * "Updated today / yesterday / 3 days ago", computed in the visitor's browser
 * from the date the figures were actually recorded. It changes every day on
 * its own and never claims the numbers are newer than they are. The server
 * HTML carries the absolute date, which is what crawlers and no-JS readers see.
 */
export function UpdatedAgo({ iso, prefix = 'Updated' }: { iso: string; prefix?: string }) {
  const date = new Date(`${iso}T12:00:00+05:30`);
  const [label, setLabel] = useState(`${prefix} ${formatDay(iso)}`);

  useEffect(() => {
    const update = () => {
      const days = istDay(new Date()) - istDay(date);
      const when = days <= 0 ? 'today' : days === 1 ? 'yesterday' : days < 30 ? `${days} days ago` : `on ${formatDay(iso)}`;
      setLabel(`${prefix} ${when}`);
    };
    update();
    const t = window.setInterval(update, 60 * 60 * 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso, prefix]);

  return (
    <time dateTime={iso} title={`Figures recorded ${formatDay(iso)}`}>
      {label}
    </time>
  );
}
