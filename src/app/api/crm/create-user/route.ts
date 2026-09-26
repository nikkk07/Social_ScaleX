import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase admin client (requires service_role key)
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
    const { email, phone, full_name, password, role } = body;

    // Validate required fields
    if (!full_name || !password || !role) {
      return NextResponse.json(
        { error: 'Full name, password, and role are required' },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }

    // Normalize phone to +91 format if provided
    let normalizedPhone = phone;
    if (phone) {
      const cleaned = phone.replace(/\D/g, '');
      normalizedPhone = cleaned.length === 10 ? `+91${cleaned}` : phone;
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email || undefined,
      phone: normalizedPhone || undefined,
      password,
      email_confirm: true, // Auto-confirm email
      phone_confirm: true, // Auto-confirm phone
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email || '',
        phone: normalizedPhone || null,
        full_name,
        role,
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      // Attempt to delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        phone: authData.user.phone,
        full_name,
        role,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
