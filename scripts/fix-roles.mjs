#!/usr/bin/env node
/**
 * Fix user roles - convert super_admin to owner
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hendwoizaxjhpwyaumsh.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlbmR3b2l6YXhqaHB3eWF1bXNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTk2NTUwMiwiZXhwIjoyMTA1NTQxNTAyfQ.H5J3OMR9VqapbUF6MbQLqElmGJKtpDo2FJ503LbFJXo';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('🔧 Fixing user roles...\n');

  // Update any super_admin roles to owner
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'owner' })
    .eq('role', 'super_admin')
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log(`✅ Updated ${data.length} profile(s):`);
    data.forEach(p => {
      console.log(`   - ${p.full_name || p.email} (super_admin → owner)`);
    });
  } else {
    console.log('✅ No profiles needed updating');
  }

  console.log('\n🎉 Done! Refresh your browser.');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
