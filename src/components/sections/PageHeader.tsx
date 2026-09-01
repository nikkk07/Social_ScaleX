import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import type { Crumb } from '@/lib/schema';

interface PageHeaderProps {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  /**
   * The answer-first opening: 40–60 words that stand on their own. It sits
   * directly under the h1 because that is the block an answer engine lifts
   * when the page is the best match for a question.
   */
  intro: string;
}

export function PageHeader({ crumbs, eyebrow, title, intro }: PageHeaderProps) {
  return (
    <header className="pt-36 pb-14 md:pt-44 md:pb-20 relative">
      <div className="max-w-4xl mx-auto px-gutter">
        <Breadcrumbs crumbs={crumbs} />
        <span className="text-cta font-medium tracking-caps uppercase text-2xs mb-4 block">
          {eyebrow}
        </span>
        <h1 className="text-6xl font-display font-bold tracking-display text-ink mb-6">
          {title}
        </h1>
        <p className="text-lg text-ink-muted max-w-3xl">
          {intro}
        </p>
      </div>
    </header>
  );
}
