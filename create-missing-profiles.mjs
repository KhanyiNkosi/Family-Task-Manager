/**
 * Manual Profile Setup Script
 * Run this script while logged in as the child user to create missing profiles
 */

import { createClient } from '@supabase/supabase-js';

// Get from browser console while logged in:
// const session = await supabase.auth.getSession()
// console.log(session.data.session.access_token)

const CHILD_ACCESS_TOKEN = process.argv[2];

if (!CHILD_ACCESS_TOKEN) {
  console.error('Usage: node create-missing-profiles.mjs <access_token>');
  console.error('\nTo get your access token:');
  console.error('1. Log in to the app as a child');
  console.error('2. Open browser console (F12)');
  console.error('3. Run: localStorage.getItem("sb-<project>-auth-token")');
  console.error('4. Or paste this in console: ');
  console.error('   const session = await supabase.auth.getSession(); console.log(session.data.session.access_token);');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${CHILD_ACCESS_TOKEN}`
      }
    }
  }
);

async function createProfiles() {
  console.log('\n=== Creating Missing Profiles ===\n');
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('❌ Not authenticated:', authError);
    return;
  }
  
  console.log('✅ Authenticated as:', user.email);
  console.log('User ID:', user.id);
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (existingProfile) {
    console.log('✅ Profile already exists');
    console.table([{
      name: existingProfile.full_name,
      role: existingProfile.role,
      family_id: existingProfile.family_id
    }]);
    return;
  }
  
  console.log('\n⚠️ No profile found. Creating...\n');
  
  // Generate or prompt for family_id
  const crypto = await import('crypto');
  const familyId = crypto.randomUUID();
  
  // Create profile
  const {error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.name || 'Child User',
      role: 'child',
      family_id: familyId
    });
    
  if (insertError) {
    console.error('❌ Failed to create profile:', insertError);
    return;
  }
  
  console.log('✅ Profile created successfully!');
  console.log('Family ID:', familyId);
  console.log('\n⚠️ NOTE: You need to create a parent profile with the same family_id');
  console.log('         for the reminder feature to work.');
}

createProfiles().then(() => process.exit(0));
