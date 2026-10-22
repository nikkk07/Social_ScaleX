// ─────────────────────────────────────────────────────────────────────
// POST /api/webhooks/razorpay  (Razorpay → us)
// Events to enable in the Razorpay dashboard:
//   payment.captured, subscription.charged, subscription.activated,
//   subscription.halted, subscription.cancelled, subscription.completed,
//   subscription.paused, subscription.resumed
// The webhook is the safety net: if the customer closes the tab right after
// paying, this still switches their automation on.
// ─────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { db } from '@/lib/server/appServer';
import { verifyWebhook } from '@/lib/server/razorpay';
import { checkoutFor, creditOrderPayment, creditSubscriptionPayment } from '@/lib/server/billing';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

interface RzpWebhook {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string | null; status?: string } };
    subscription?: { entity?: { id?: string; status?: string } };
  };
}

export async function POST(req: Request) {
  const raw = await req.text();
  try {
    if (!verifyWebhook(raw, req.headers.get('x-razorpay-signature'))) return new NextResponse('bad signature', { status: 400 });
  } catch (e) {
    console.error('[rzp webhook] config', e);
    return new NextResponse('not configured', { status: 500 });
  }

  const eventId = req.headers.get('x-razorpay-event-id');
  const sb = db();
  if (eventId) {
    const { data } = await sb.from('rzp_events').select('event_id').eq('event_id', eventId).maybeSingle();
    if (data) return NextResponse.json({ ok: true, duplicate: true });
  }

  let body: RzpWebhook;
  try {
    body = JSON.parse(raw) as RzpWebhook;
  } catch {
    return new NextResponse('bad json', { status: 400 });
  }

  try {
    const pay = body.payload?.payment?.entity;
    const sub = body.payload?.subscription?.entity;
    switch (body.event) {
      case 'payment.captured': {
        if (pay?.id && pay.order_id) {
          const co = await checkoutFor(pay.order_id);
          if (co?.kind === 'order') await creditOrderPayment(co, pay.id);
        }
        break;
      }
      case 'subscription.charged':
      case 'subscription.activated': {
        if (sub?.id) {
          const co = await checkoutFor(sub.id);
          if (co?.kind === 'subscription') {
            if (pay?.id) await creditSubscriptionPayment(co, pay.id);
            else await sb.from('ig_billing').update({ rzp_status: sub.status ?? 'active' }).eq('account_id', co.account_id);
          }
        }
        break;
      }
      case 'subscription.halted':
      case 'subscription.cancelled':
      case 'subscription.completed':
      case 'subscription.paused':
      case 'subscription.resumed':
      case 'subscription.pending': {
        // Status only. paid_until is never shortened: what was paid for runs
        // to its end, then the automation stops by itself.
        if (sub?.id) await sb.from('ig_billing').update({ rzp_status: sub.status ?? body.event.split('.')[1] }).eq('rzp_subscription_id', sub.id);
        break;
      }
      default:
        break;
    }
    if (eventId) await sb.from('rzp_events').insert({ event_id: eventId });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // 500 makes Razorpay retry; crediting is idempotent, so retries are safe.
    console.error('[rzp webhook]', body.event, e);
    return new NextResponse('error', { status: 500 });
  }
}
