// GET    /api/app/accounts/:id → account, plan, automations, last 50 comments handled
// DELETE /api/app/accounts/:id → remove the account (cancels AutoPay first)
import { NextResponse } from 'next/server';
import { db, errorResponse, HttpError, isPaid, NO_STORE, ownedAccount, requireUser } from '@/lib/server/appServer';
import { ACCOUNT_PUBLIC_COLUMNS, type IgBillingRow } from '@/lib/server/appTypes';
import { removeAccount } from '@/lib/server/accounts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    const account = await ownedAccount(user.id, id, ACCOUNT_PUBLIC_COLUMNS);
    const sb = db();
    const [bill, rules, events] = await Promise.all([
      sb.from('ig_billing').select('*').eq('account_id', id).maybeSingle(),
      sb.from('ig_automations').select('*').eq('account_id', id).order('created_at'),
      sb.from('ig_events')
        .select('id, automation_id, commenter_username, comment_text, status, detail, dm_sent, reply_sent, created_at')
        .eq('account_id', id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);
    const b = bill.data as IgBillingRow | null;
    return NextResponse.json(
      {
        account,
        billing: b ? { mode: b.mode, status: b.rzp_status, paidUntil: b.paid_until, active: isPaid(b.paid_until) } : null,
        automations: rules.data ?? [],
        events: events.data ?? [],
      },
      { headers: NO_STORE },
    );
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    await ownedAccount(user.id, id, 'id');
    if (!(await removeAccount(id))) {
      throw new HttpError(502, 'cancel_failed', 'Could not stop AutoPay right now, so nothing was removed. Please try again.');
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
