import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Crumb } from '@/lib/schema';

/**
 * Visible breadcrumb trail. Always rendered alongside the BreadcrumbList
 * JSON-LD for the same page — structured data describing a trail the reader
 * cannot see is the kind of mismatch Google discounts the markup for.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-subtle">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={c.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight size={14} aria-hidden className="text-ink-decor" />}
              {isLast ? (
                <span aria-current="page" className="text-ink-muted">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className="hover:text-ink transition-colors">
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
