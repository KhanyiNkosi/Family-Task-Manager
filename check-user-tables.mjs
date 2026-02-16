// Quick check of user_profiles table
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n🔍 Checking user_profiles table...\n');

const { data, error } = await supabase
  .from('user_profiles')
  .select('*');

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log(`Found ${data?.length || 0} rows in user_profiles`);
  console.log(JSON.stringify(data, null, 2));
}

console.log('\n🔍 Checking profiles table...\n');

const { data: profiles, error: profilesError } = await supabase
  .from('profiles')
  .select('id, full_name, family_id');

if (profilesError) {
  console.log('❌ Error:', profilesError.message);
} else {
  console.log(`Found ${profiles?.length || 0} rows in profiles`);
  profiles?.forEach(p => {
    console.log(`  - ${p.full_name} (${p.id})`);
  });
}
