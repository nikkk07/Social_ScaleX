import React from 'react';
import Link from 'next/link';
import { Camera, Clapperboard, LayoutGrid, Megaphone, MessageCircle, Users, type LucideIcon } from 'lucide-react';
import { WhatsappIcon } from '@/components/icons/WhatsappIcon';
import { SectionHead } from '@/components/site/SectionHead';
import { CONTROL_ROOM, SERVICES } from '@/lib/content';

type TileIcon = (typeof CONTROL_ROOM.tiles)[number]['icon'];

const ICONS: Record<Exclude<TileIcon, 'whatsapp'>, LucideIcon> = {
  clapperboard: Clapperboard,
  'layout-grid': LayoutGrid,
  megaphone: Megaphone,
  users: Users,
  'message-circle': MessageCircle,
  camera: Camera,
};

function TileIcon({ name }: { name: TileIcon }) {
  if (name === 'whatsapp') return <WhatsappIcon size={26} />;
  const Icon = ICONS[name];
  return <Icon className="size-[1.625rem]" strokeWidth={1.75} aria-hidden="true" />;
}

/**
 * Homepage section 5: seven tiles, each a real link, standing on CSS
 * isometric plates that rise on hover and keyboard focus. Every other
 * service is listed underneath, so no service page loses its homepage link.
 */
export function ServicesControlRoom() {
  const tiled = new Set<string>(CONTROL_ROOM.tiles.map((t) => t.href));
  const rest = SERVICES.filter((s) => !tiled.has(`/services/${s.slug}`));
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-24 border-t border-line bg-paper-2 py-section">
      <div className="wrap">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHead id="services-title" eyebrow={CONTROL_ROOM.eyebrow} title={CONTROL_ROOM.title} intro={CONTROL_ROOM.intro} />
          <Link href="/services" className="btn btn-secondary self-start md:self-auto">All services</Link>
        </div>

        <ul className="rise mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
          {CONTROL_ROOM.tiles.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="room-tile card flex h-full flex-col items-center p-5 text-center">
                <span aria-hidden="true" className="relative grid h-20 w-full place-items-start justify-center [perspective:600px]">
                  <span className="room-plate" />
                  <span className="relative grid size-12 place-items-center rounded-xl bg-surface text-ink shadow-soft ring-1 ring-line">
                    <TileIcon name={t.icon} />
                  </span>
                </span>
                <span className="mt-3 font-display text-lg leading-tight text-ink">{t.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 border-t border-line-strong/60 pt-6">
          <p className="text-sm font-semibold text-ink">Also from the same team</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {rest.map((s) => (
              <li key={s.slug}>
                <Link href={`/services/${s.slug}`} className="inline-flex min-h-10 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:border-ink">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
