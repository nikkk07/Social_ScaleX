// Analytics IDs come from Vercel environment variables, so nothing loads
// until an ID is set, and preview deployments never send data.
//   NEXT_PUBLIC_GA_ID          Google Analytics 4 Measurement ID (G-XXXXXXX)
//   NEXT_PUBLIC_META_PIXEL_ID  Meta (Facebook) Pixel ID (digits only)

const isProd = process.env.VERCEL_ENV === undefined || process.env.VERCEL_ENV === 'production';

const ga = (process.env.NEXT_PUBLIC_GA_ID ?? '').trim();
const pixel = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '').trim();

/** Only well-formed IDs are used, so a typo can never inject markup. */
export const GA_ID = isProd && /^G-[A-Z0-9]{4,20}$/.test(ga) ? ga : '';
export const META_PIXEL_ID = isProd && /^\d{6,20}$/.test(pixel) ? pixel : '';
