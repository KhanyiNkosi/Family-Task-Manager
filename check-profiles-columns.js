#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesStructure() {
  console.log('\n👤 PROFILES TABLE STRUCTURE CHECK\n');

  // Get first profile to see its structure
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (!error && profiles && profiles.length > 0) {
    console.log('✅ Sample profile structure:');
    console.log(JSON.stringify(profiles[0], null, 2));
  } else {
    console.log('❌ Error or no profiles found:', error?.message);
  }
}

checkProfilesStructure().catch(console.error);
