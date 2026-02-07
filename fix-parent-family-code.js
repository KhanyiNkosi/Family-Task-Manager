const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixParentFamilyCode() {
  console.log('\n🔧 Fixing Parent family_code\n');

  const parentId = '081a3483-9e2b-43e6-bf89-302fac88b186';
  const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

  try {
    // Get current parent data
    const { data: { user: parentBefore }, error: fetchError } = await supabase.auth.admin.getUserById(parentId);
    
    if (fetchError || !parentBefore) {
      console.error('❌ Cannot fetch parent:', fetchError?.message);
      return;
    }

    console.log('📋 Current parent metadata:');
    console.log('   family_code:', parentBefore.user_metadata.family_code || '(empty)');
    console.log('   role:', parentBefore.user_metadata.role);
    console.log('   name:', parentBefore.user_metadata.name);

    // Update parent's family_code
    console.log('\n🔄 Updating family_code to:', familyId);
    
    const { data, error } = await supabase.auth.admin.updateUserById(
      parentId,
      {
        user_metadata: {
          ...parentBefore.user_metadata,
          family_code: familyId
        }
      }
    );

    if (error) {
      console.error('❌ Update failed:', error.message);
      return;
    }

    console.log('✅ Parent family_code updated successfully!');

    // Verify the update
    const { data: { user: parentAfter } } = await supabase.auth.admin.getUserById(parentId);
    
    console.log('\n✅ Verified - New metadata:');
    console.log('   family_code:', parentAfter.user_metadata.family_code);
    console.log('   role:', parentAfter.user_metadata.role);
    console.log('   name:', parentAfter.user_metadata.name);

    console.log('\n🎉 SUCCESS! Notification triggers should now work!');
    console.log('   Test by: Child completes task → Parent gets notification');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }

  process.exit(0);
}

fixParentFamilyCode();
