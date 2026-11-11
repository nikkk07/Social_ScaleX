import React from 'react';

/**
 * Pre-sized guide illustration, served straight from the CDN as AVIF with a
 * WebP fallback. No on-demand resizing, so the first visitor gets it as fast
 * as the hundredth. Files live at `${base}-${width}.{avif,webp}` (see
 * public/guides/*), and a ~200-byte blurred preview fills the box instantly.
 */
export interface GuideImg {
  /** Path without width or extension, e.g. /guides/x/hero-v1 (bump v1 when the image changes). */
  base: string;
  alt: string;
  /** Intrinsic size, for the aspect ratio. */
  width: number;
  height: number;
  /** Widths generated on disk, smallest first. */
  widths: number[];
  /** Tiny inline WebP shown while the real image loads. */
  blur: string;
}

export function GuideImage({ img, sizes, priority = false, className = '' }: { img: GuideImg; sizes: string; priority?: boolean; className?: string }) {
  const set = (ext: string) => img.widths.map((w) => `${img.base}-${w}.${ext} ${w}w`).join(', ');
  const fallback = img.widths.find((w) => w >= 768) ?? img.widths[img.widths.length - 1];
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <img
        src={`${img.base}-${fallback}.webp`}
        srcSet={set('webp')}
        sizes={sizes}
        alt={img.alt}
        width={img.width}
        height={img.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={className}
        style={{ backgroundImage: `url("${img.blur}")`, backgroundSize: 'cover' }}
      />
    </picture>
  );
}
