import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { member_id, daily_lead_quota } = body;

    if (!member_id) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    if (daily_lead_quota !== null && (typeof daily_lead_quota !== 'number' || daily_lead_quota < 0)) {
      return NextResponse.json(
        { error: 'Quota must be a positive number or null' },
        { status: 400 }
      );
    }

    // Update the member's quota
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ daily_lead_quota })
      .eq('id', member_id);

    if (error) {
      console.error('Update quota error:', error);
      return NextResponse.json(
        { error: 'Failed to update quota' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, daily_lead_quota });
  } catch (error) {
    console.error('Update quota error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
