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
      <div className="max-w-4xl mx-auto px-6">
        <Breadcrumbs crumbs={crumbs} />
        <span className="text-[var(--color-violet-light)] font-medium tracking-wider uppercase text-sm mb-4 block">
          {eyebrow}
        </span>
        <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-white mb-6 leading-[1.05]">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-3xl">
          {intro}
        </p>
      </div>
    </header>
  );
}
