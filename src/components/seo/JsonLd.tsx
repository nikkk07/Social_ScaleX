import React from 'react';
import type { SchemaNode } from '@/lib/schema';

/**
 * Renders a JSON-LD graph into the static HTML (server component, so
 * crawlers that don't run JavaScript still read it). `<` is escaped so no
 * string in the data can close the script tag early.
 */
export function JsonLd({ data }: { data: SchemaNode }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
