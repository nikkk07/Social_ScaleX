'use client';

import { useEffect } from 'react';
import { requestMotion, type MotionFeature } from '@/lib/motion';

/**
 * Registers a section's interest in the motion layer. Renders nothing.
 *
 * The section is already complete without it — its CSS base layer carries the
 * effect — so this only ever asks for a refinement. The layer boots when at
 * least two distinct features have asked (MOTION_THRESHOLD); with one, this
 * is a no-op and 55.5 kB is never fetched.
 *
 * Kept as its own tiny client component so the section around it stays a
 * server component and ships no JavaScript of its own.
 */
export function MotionRequest({ feature }: { feature: MotionFeature }) {
  useEffect(() => {
    requestMotion(feature);
  }, [feature]);

  return null;
}
