import React from 'react';
import type { Crumb } from '@/lib/schema';
import { Breadcrumbs } from './Breadcrumbs';

export function PageIntro({
  crumbs,
  eyebrow,
  title,
  lede,
  children,
}: {
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  lede: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section aria-labelledby="page-title" className="border-b border-line">
      <div className="wrap pb-16 pt-8 sm:pb-20">
        <Breadcrumbs crumbs={crumbs} />
        {eyebrow ? <p className="eyebrow mt-10">{eyebrow}</p> : null}
        <h1 id="page-title" className={`${eyebrow ? 'mt-4' : 'mt-10'} max-w-4xl text-5xl text-ink`}>{title}</h1>
        <div className="mt-6 max-w-2xl text-lg text-ink-2">{lede}</div>
        {children}
      </div>
    </section>
  );
}
