// GET /api/app/profile → { profile | null }
// PUT /api/app/profile { name, mobile, whatsappSame, whatsapp? } → { profile }
// Google sign-ups land here once to add their mobile and WhatsApp number.
import { NextResponse } from 'next/server';
import { db, errorResponse, NO_STORE, readJson, requireUser } from '@/lib/server/appServer';
import { fieldErrors, ProfileInput } from '@/lib/app/forms';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    const { data } = await db().from('app_customers').select('full_name, phone, whatsapp').eq('user_id', user.id).maybeSingle();
    return NextResponse.json({ profile: data ?? null, email: user.email, name: user.name }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser(req);
    const parsed = ProfileInput.safeParse(await readJson(req));
    if (!parsed.success) {
      const errors = fieldErrors(parsed.error);
      return NextResponse.json({ error: 'invalid_input', message: Object.values(errors)[0], fields: errors }, { status: 400, headers: NO_STORE });
    }
    const v = parsed.data;
    const sb = db();
    const { data: other } = await sb.from('app_customers').select('user_id').eq('phone', v.mobile).neq('user_id', user.id).maybeSingle();
    if (other) {
      return NextResponse.json(
        { error: 'mobile_taken', message: 'This mobile number is linked to another account.', fields: { mobile: 'Linked to another account. Sign in with it, or use another number.' } },
        { status: 409, headers: NO_STORE },
      );
    }
    const { data, error } = await sb
      .from('app_customers')
      .upsert({ user_id: user.id, full_name: v.name, phone: v.mobile, whatsapp: v.whatsapp })
      .select('full_name, phone, whatsapp')
      .single();
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'mobile_taken', message: 'This mobile number is linked to another account.', fields: { mobile: 'Linked to another account.' } }, { status: 409, headers: NO_STORE });
      }
      throw error;
    }
    return NextResponse.json({ profile: data }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
