import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { member_id, quota } = body;

    if (!member_id || !quota) {
      return NextResponse.json(
        { error: 'Member ID and quota are required' },
        { status: 400 }
      );
    }

    // Use admin client for RPC call
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

    // Get the current user from the request header
    const authHeader = request.headers.get('authorization');
    let assigned_by = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      assigned_by = user?.id || null;
    }

    // Call the assign_leads_to_member function
    const { data, error } = await supabaseAdmin.rpc('assign_leads_to_member', {
      p_member_id: member_id,
      p_quota: quota,
      p_assigned_by: assigned_by,
    });

    if (error) {
      console.error('Assign leads error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to assign leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      assigned_count: data 
    });
  } catch (error) {
    console.error('Assign leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
