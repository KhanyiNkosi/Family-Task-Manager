const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFamilyCode() {
  console.log('\n🔍 Checking family_code in auth.users\n');

  const parentId = '081a3483-9e2b-43e6-bf89-302fac88b186';
  const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
  const expectedFamilyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

  try {
    // Get parent user metadata
    const { data: { user: parent }, error: parentError } = await supabase.auth.admin.getUserById(parentId);
    
    if (parentError || !parent) {
      console.error('❌ Cannot fetch parent:', parentError?.message);
      return;
    }

    console.log('👨 Parent User:');
    console.log('   ID:', parent.id);
    console.log('   Email:', parent.email);
    console.log('   Metadata:', JSON.stringify(parent.user_metadata, null, 2));
    
    const parentFamilyCode = parent.user_metadata?.family_code;
    console.log('\n   family_code in metadata:', parentFamilyCode);
    console.log('   Expected family_id:', expectedFamilyId);
    console.log('   Match:', parentFamilyCode === expectedFamilyId);

    // Get child user metadata
    const { data: { user: child }, error: childError } = await supabase.auth.admin.getUserById(childId);
    
    if (childError || !child) {
      console.error('❌ Cannot fetch child:', childError?.message);
      return;
    }

    console.log('\n👶 Child User:');
    console.log('   ID:', child.id);
    console.log('   Email:', child.email);
    console.log('   Metadata:', JSON.stringify(child.user_metadata, null, 2));
    
    const childFamilyCode = child.user_metadata?.family_code;
    console.log('\n   family_code in metadata:', childFamilyCode);
    console.log('   Expected family_id:', expectedFamilyId);
    console.log('   Match:', childFamilyCode === expectedFamilyId);

    // Determine fix needed
    console.log('\n💡 FIX NEEDED:');
    if (parentFamilyCode !== expectedFamilyId) {
      console.log('   ❌ Parent family_code needs to be updated to:', expectedFamilyId);
      console.log('   Run: supabase.auth.admin.updateUserById()');
    }
    if (childFamilyCode !== expectedFamilyId) {
      console.log('   ❌ Child family_code needs to be updated to:', expectedFamilyId);
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }

  process.exit(0);
}

checkFamilyCode();
