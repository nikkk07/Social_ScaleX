import React from 'react';
import type { SchemaNode } from '@/lib/schema';

/**
 * Renders a JSON-LD graph into the static HTML.
 *
 * This is a server component on purpose. The previous build injected FAQPage
 * schema from inside a client component, so it only existed after React
 * hydrated — invisible to every crawler that does not run JavaScript, which
 * includes GPTBot, ClaudeBot, PerplexityBot and CCBot.
 */
export function JsonLd({ data }: { data: SchemaNode }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
