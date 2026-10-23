// GET /api/app/me → the signed-in customer, their Instagram accounts, plan
// status and automation counts. One call renders the whole dashboard home.
import { NextResponse } from 'next/server';
import { db, errorResponse, isPaid, NO_STORE, requireUser } from '@/lib/server/appServer';
import { ACCOUNT_PUBLIC_COLUMNS, type IgBillingRow } from '@/lib/server/appTypes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const sb = db();
    const { data: accounts, error } = await sb
      .from('ig_accounts')
      .select(ACCOUNT_PUBLIC_COLUMNS)
      .eq('user_id', user.id)
      .neq('status', 'disconnected')
      .order('created_at');
    if (error) throw error;
    const ids = (accounts ?? []).map((a) => (a as { id: string }).id);
    const [{ data: bills }, { data: rules }, { data: profile }] = await Promise.all([
      ids.length ? sb.from('ig_billing').select('*').in('account_id', ids) : Promise.resolve({ data: [] }),
      ids.length ? sb.from('ig_automations').select('account_id, is_enabled').in('account_id', ids) : Promise.resolve({ data: [] }),
      sb.from('app_customers').select('full_name, phone, whatsapp').eq('user_id', user.id).maybeSingle(),
    ]);
    const out = (accounts ?? []).map((a) => {
      const acc = a as { id: string };
      const bill = ((bills ?? []) as IgBillingRow[]).find((b) => b.account_id === acc.id) ?? null;
      const mine = ((rules ?? []) as { account_id: string; is_enabled: boolean }[]).filter((r) => r.account_id === acc.id);
      return {
        ...acc,
        billing: bill ? { mode: bill.mode, status: bill.rzp_status, paidUntil: bill.paid_until, active: isPaid(bill.paid_until) } : null,
        automations: { total: mine.length, enabled: mine.filter((r) => r.is_enabled).length },
      };
    });
    return NextResponse.json({ user, profile: profile ?? null, accounts: out }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
