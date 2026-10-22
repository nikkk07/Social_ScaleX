// POST /api/app/auth/google  { credential }  →  { session }
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse, HttpError, NO_STORE, readJson } from '@/lib/server/appServer';
import { claimWithGoogle, ensureUser, verifyGoogle } from '@/lib/server/appAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const Body = z.object({ credential: z.string().min(20).max(5000) });

export async function POST(req: Request) {
  try {
    const parsed = Body.safeParse(await readJson(req));
    if (!parsed.success) throw new HttpError(400, 'invalid_input', 'Google sign-in failed. Please try again.');
    const who = await verifyGoogle(parsed.data.credential);
    await ensureUser(who.email, who.name, undefined, true);
    const session = await claimWithGoogle(who.email);
    return NextResponse.json({ session }, { headers: NO_STORE });
  } catch (e) {
    return errorResponse(e);
  }
}
