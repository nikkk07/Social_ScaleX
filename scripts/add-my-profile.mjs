#!/usr/bin/env node
/**
 * Add a profile for the current authenticated user
 * Usage: node scripts/add-my-profile.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('🔍 Looking for authenticated users...\n');

  // Get all users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    process.exit(1);
  }

  if (!users || users.users.length === 0) {
    console.log('❌ No users found in auth.users');
    console.log('You need to sign up first at http://localhost:3000/login');
    process.exit(1);
  }

  console.log(`✅ Found ${users.users.length} user(s):\n`);
  users.users.forEach((user, i) => {
    console.log(`${i + 1}. ID: ${user.id}`);
    console.log(`   Email: ${user.email || '(none)'}`);
    console.log(`   Phone: ${user.phone || '(none)'}`);
    console.log(`   Created: ${user.created_at}\n`);
  });

  // Check which users don't have profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
    process.exit(1);
  }

  const profileIds = new Set(profiles.map(p => p.id));
  const usersWithoutProfiles = users.users.filter(u => !profileIds.has(u.id));

  if (usersWithoutProfiles.length === 0) {
    console.log('✅ All users already have profiles!');
    console.log('\nExisting profiles:');
    profiles.forEach(p => {
      console.log(`- ${p.full_name || p.email} (${p.role})${p.is_active ? '' : ' [INACTIVE]'}`);
    });
    process.exit(0);
  }

  console.log(`\n🔧 Creating profiles for ${usersWithoutProfiles.length} user(s)...\n`);

  for (const user of usersWithoutProfiles) {
    const email = user.email || '';
    const phone = user.phone || '';
    const name = email.split('@')[0] || phone || 'User';
    
    console.log(`Creating profile for: ${email || phone}`);
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: email || null,
        phone: phone || null,
        full_name: name.charAt(0).toUpperCase() + name.slice(1),
        role: 'owner', // First user gets owner role
        is_active: true,
        daily_lead_quota: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error creating profile for ${email || phone}:`, error.message);
    } else {
      console.log(`✅ Created profile: ${data.full_name} (${data.role})\n`);
    }
  }

  console.log('\n🎉 Done! Refresh your browser at http://localhost:3000/crm');
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
