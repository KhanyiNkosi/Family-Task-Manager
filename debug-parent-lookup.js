const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugParentLookup() {
  console.log('🔍 Debugging Parent Lookup for Completion Notification\n');
  console.log('=' .repeat(70));

  try {
    const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';
    const parentId = '081a3483-9e2b-43e6-bf89-302fac88b186';

    console.log('\n📋 Test Data:');
    console.log(`   Family ID: ${familyId} (UUID)`);
    console.log(`   Expected Parent ID: ${parentId}\n`);

    // Check how the trigger looks up parent
    console.log('🔎 Method 1: profiles table lookup (what trigger tries first)\n');
    
    const { data: profilesLookup, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('family_id', familyId);

    if (profilesError) {
      console.error('   ❌ Error:', profilesError.message);
    } else if (!profilesLookup || profilesLookup.length === 0) {
      console.log('   ❌ No results found');
      console.log('   💡 This is why parent notification fails!\n');
    } else {
      console.log(`   ✅ Found ${profilesLookup.length} profile(s):`);
      profilesLookup.forEach((p, i) => {
        console.log(`      ${i + 1}. ID: ${p.id}`);
        console.log(`         family_id: ${p.family_id}`);
        console.log(`         name: ${p.name || 'Not set'}`);
      });
      console.log('');
    }

    // Check what's actually in profiles table
    console.log('🔎 All profiles in family (different approach)\n');
    
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    if (allProfiles && allProfiles.length > 0) {
      console.log(`   Found ${allProfiles.length} total profiles:`);
      allProfiles.forEach((p, i) => {
        console.log(`      ${i + 1}. ID: ${p.id}`);
        console.log(`         family_id: ${p.family_id}`);
        console.log(`         family_id type: ${typeof p.family_id}`);
        console.log(`         Matches our family? ${p.family_id === familyId}`);
        console.log(`         Matches as string? ${p.family_id === familyId.toString()}`);
      });
      console.log('');
    }

    // Check if parent exists at all
    console.log('🔎 Check if parent profile exists\n');
    
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', parentId)
      .single();

    if (parentProfile) {
      console.log('   ✅ Parent profile exists:');
      console.log(`      ID: ${parentProfile.id}`);
      console.log(`      family_id: ${parentProfile.family_id}`);
      console.log(`      family_id type: ${typeof parentProfile.family_id}`);
      console.log(`      Expected: ${familyId}`);
      console.log(`      Match? ${parentProfile.family_id === familyId}`);
      console.log(`      Match as string? ${parentProfile.family_id === familyId.toString()}\n`);
    } else {
      console.log('   ❌ Parent profile not found!\n');
    }

    // Check auth.users (fallback method)
    console.log('🔎 Method 2: auth.users lookup (trigger fallback)\n');
    
    // We can't query auth.users directly via REST API, but we can check user metadata
    console.log('   ⚠️  Cannot query auth.users directly from here');
    console.log('   The trigger will try this as a fallback.\n');

    console.log('=' .repeat(70));
    console.log('\n💡 DIAGNOSIS:\n');

    if (!profilesLookup || profilesLookup.length === 0) {
      console.log('❌ ISSUE FOUND: Parent not found in profiles table');
      console.log('   The trigger cannot find the parent because:');
      console.log('   - profiles table query returns no results');
      console.log('   - family_id might be NULL or different format\n');
      
      if (parentProfile) {
        if (parentProfile.family_id === null) {
          console.log('✅ SOLUTION: Parent family_id is NULL');
          console.log('   Need to set parent\'s family_id in profiles table.\n');
        } else if (parentProfile.family_id !== familyId) {
          console.log(`✅ SOLUTION: Parent has different family_id`);
          console.log(`   Parent's family_id: ${parentProfile.family_id}`);
          console.log(`   Expected: ${familyId}\n`);
        }
      }
    } else {
      console.log('✅ Parent WAS found in profiles table');
      console.log('   The trigger should work. Check:');
      console.log('   1. Database logs for trigger errors');
      console.log('   2. RLS policies on notifications table\n');
    }

  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    console.error(error);
  }
}

debugParentLookup();
