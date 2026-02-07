#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  console.log('\n📊 CHECKING ALL TABLES\n');

  // Check profiles
  console.log('1️⃣  profiles table:');
  const { data: profiles } = await supabase.from('profiles').select('*').limit(1);
  if (profiles && profiles.length > 0) {
    console.log('   Columns:', Object.keys(profiles[0]).join(', '));
  }

  // Check user_profiles
  console.log('\n2️⃣  user_profiles table:');
  const { data: userProfiles, error: upError } = await supabase.from('user_profiles').select('*').limit(1);
  if (upError) {
    console.log('   ❌ Error:', upError.message);
  } else if (userProfiles && userProfiles.length > 0) {
    console.log('   Columns:', Object.keys(userProfiles[0]).join(', '));
    console.log('   Sample:', JSON.stringify(userProfiles[0], null, 2));
  } else {
    console.log('   ⚠️  Table exists but empty');
  }

  // Check auth.users metadata structure
  console.log('\n3️⃣  Checking auth.users metadata:');
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log('   User metadata:', JSON.stringify(user.user_metadata, null, 2));
    console.log('   Raw metadata:', JSON.stringify(user.raw_user_meta_data, null, 2));
  } else {
    console.log('   ⚠️  Not authenticated');
  }
}

checkAllTables().catch(console.error);
