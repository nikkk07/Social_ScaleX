import React from 'react';

export function SectionHead({
  id,
  eyebrow,
  title,
  intro,
  className = '',
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 id={id} className="mt-4 text-4xl text-ink">{title}</h2>
      {intro ? <p className="mt-4 text-lg text-ink-2">{intro}</p> : null}
    </div>
  );
}
