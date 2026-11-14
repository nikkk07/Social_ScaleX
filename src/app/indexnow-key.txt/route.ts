// IndexNow key (Bing, Yandex, Seznam …): the CRM keeps the key; search engines read it here before trusting a ping.
export const revalidate = 3600;

export async function GET() {
  const r = await fetch('https://crm.socialscalex.in/api/indexnow-key?domain=socialscalex.in', { next: { revalidate: 3600 } }).catch(() => null);
  if (!r || !r.ok) return new Response('not configured', { status: 404 });
  return new Response((await r.text()).trim(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
