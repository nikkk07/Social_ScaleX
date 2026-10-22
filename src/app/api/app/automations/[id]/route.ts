// PATCH  /api/app/automations/:id  full builder body, or { isEnabled } to pause / resume
// DELETE /api/app/automations/:id
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, errorResponse, HttpError, NO_STORE, readJson, requireUser } from '@/lib/server/appServer';
import { toRow } from '@/lib/server/automations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

async function owned(userId: string, id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, 'not_found', 'Automation not found.');
  const { data } = await db().from('ig_automations').select('id, ig_accounts!inner(user_id)').eq('id', id).eq('ig_accounts.user_id', userId).maybeSingle();
  if (!data) throw new HttpError(404, 'not_found', 'Automation not found.');
}

const Toggle = z.object({ isEnabled: z.boolean() }).strict();

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    await owned(user.id, id);
    const body = await readJson(req);
    const toggle = Toggle.safeParse(body);
    const patch = toggle.success ? { is_enabled: toggle.data.isEnabled } : toRow(body);
    const { data, error } = await db().from('ig_automations').update(patch).eq('id', id).select('*').single();
    if (error) throw error;
    return NextResponse.json({ automation: data }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser(req);
    const { id } = await params;
    await owned(user.id, id);
    const { error } = await db().from('ig_automations').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
