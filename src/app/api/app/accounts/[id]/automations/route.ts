// POST /api/app/accounts/:id/automations → create an automation
import { NextResponse } from 'next/server';
import { db, errorResponse, HttpError, NO_STORE, ownedAccount, readJson, requireUser } from '@/lib/server/appServer';
import { MAX_AUTOMATIONS_PER_ACCOUNT, toRow } from '@/lib/server/automations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    await ownedAccount(user.id, id, 'id');
    const row = toRow(await readJson(req));
    const sb = db();
    const { count } = await sb.from('ig_automations').select('id', { count: 'exact', head: true }).eq('account_id', id);
    if ((count ?? 0) >= MAX_AUTOMATIONS_PER_ACCOUNT) throw new HttpError(400, 'too_many', 'This account has the maximum number of automations.');
    const { data, error } = await sb.from('ig_automations').insert({ ...row, account_id: id }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ automation: data }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
