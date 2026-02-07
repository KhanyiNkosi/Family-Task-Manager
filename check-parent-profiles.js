const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkParentLookup() {
  console.log('\n🔍 Debugging Parent Lookup\n');

  const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';
  const parentId = '081a3483-9e2b-43e6-bf89-302fac88b186';

  try {
    // Check profiles table
    console.log('1️⃣ Checking profiles table for parent...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', familyId);
    
    if (profileError) {
      console.error('❌ Error:', profileError);
    } else {
      console.log(`✅ Found ${profiles.length} profiles in family:`);
      profiles.forEach(p => {
        console.log(`   - ${p.id}: role=${p.role}, family_id=${p.family_id}`);
      });
      
      const parent = profiles.find(p => p.role === 'parent');
      if (parent) {
        console.log(`\n✅ Parent found in profiles: ${parent.id}`);
      } else {
        console.log('\n❌ No parent role in profiles table!');
      }
    }

    // Check user_profiles table
    console.log('\n2️⃣ Checking user_profiles table...');
    const { data: userProfiles, error: upError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('family_id', familyId);
    
    if (upError) {
      console.error('❌ Error:', upError);
    } else {
      console.log(`✅ Found ${userProfiles.length} user profiles`);
    }

    console.log('\n💡 SOLUTION:');
    console.log('   Triggers should use profiles table instead of auth.users!');
    console.log('   profiles.role = \'parent\' AND profiles.family_id = task.family_id');

  } catch (error) {
    console.error('❌ Check failed:', error);
  }

  process.exit(0);
}

checkParentLookup();
