// ─────────────────────────────────────────────────────────────────────
// Conversion events for GA4 and the Meta Pixel.
//
// Both scripts load only when their production IDs are set (tracking.ts),
// so every call here is a silent no-op until then. Events carry the contact
// method and the page path, never the phone number, the email address or
// anything typed into the form.
//
//   GA4:  contact_click { method, page_path }    generate_lead { method: 'website_form', page_path }
//   Meta: Contact { content_category: method }   Lead
// ─────────────────────────────────────────────────────────────────────

export type ContactMethod = 'whatsapp' | 'phone' | 'email';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

/** Which contact route a link opens, or null for an ordinary link. Pure, so it is unit-tested. */
export function contactMethod(href: string): ContactMethod | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith('tel:')) return 'phone';
  if (h.startsWith('mailto:')) return 'email';
  if (h.startsWith('whatsapp:')) return 'whatsapp';
  try {
    const host = new URL(h).hostname;
    if (host === 'wa.me' || host === 'api.whatsapp.com' || host === 'web.whatsapp.com') return 'whatsapp';
  } catch {
    // Relative or malformed href: not a contact link.
  }
  return null;
}

function pagePath(): string {
  return typeof window === 'undefined' ? '' : window.location.pathname;
}

export function trackContact(method: ContactMethod): void {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', 'contact_click', { method, page_path: pagePath() });
  window.fbq?.('track', 'Contact', { content_category: method });
}

/** Call only after the enquiry was actually stored. */
export function trackLead(): void {
  if (typeof window === 'undefined') return;
  window.gtag?.('event', 'generate_lead', { method: 'website_form', page_path: pagePath() });
  window.fbq?.('track', 'Lead');
}
