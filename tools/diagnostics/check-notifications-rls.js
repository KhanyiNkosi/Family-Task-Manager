require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkNotificationsRLS() {
  console.log('🔒 Checking notifications table RLS policies...\n');
  
  // Check current RLS policies
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('schemaname', 'public')
    .eq('tablename', 'notifications');
  
  if (error) {
    console.log('Error fetching policies:', error);
  } else {
    console.log(`Found ${policies?.length || 0} RLS policies for notifications table:`);
    policies?.forEach(p => {
      console.log(`\n📋 Policy: ${p.policyname}`);
      console.log(`   Command: ${p.cmd}`);
      console.log(`   Roles: ${p.roles}`);
      console.log(`   Using: ${p.qual || 'N/A'}`);
      console.log(`   With Check: ${p.with_check || 'N/A'}`);
    });
  }
  
  // Check if RLS is enabled
  const { data: tables } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'notifications');
  
  console.log('\n📊 Table info:', tables);
}

checkNotificationsRLS().catch(console.error);
