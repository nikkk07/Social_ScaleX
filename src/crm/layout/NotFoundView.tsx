import React from 'react';
import Link from 'next/link';

export function NotFoundView({ what = 'page' }: { what?: string }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-lg font-semibold">This {what} doesn’t exist</h1>
      <p className="mt-2 text-sm text-muted-foreground">It may have been removed, or it isn’t assigned to you.</p>
      <Link href="/crm" className="mt-6 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">Back to Today</Link>
    </div>
  );
}
