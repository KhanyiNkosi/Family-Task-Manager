const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function comprehensiveDiagnostic() {
  console.log('\n🔬 COMPREHENSIVE NOTIFICATION DIAGNOSTIC\n');
  console.log('='.repeat(60));

  const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
  const parentId = '081a3483-9e2b-43e6-bf89-302fac88b186';
  const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

  try {
    // 1. Test helper functions existence (if we can)
    console.log('\n1️⃣ Testing Helper Functions');
    console.log('-'.repeat(60));
    
    // Try calling the helper directly
    const { data: testHelper, error: helperError } = await supabase
      .rpc('create_notification', {
        p_user_id: parentId,
        p_family_id: familyId,
        p_title: 'Direct Helper Test',
        p_message: 'Testing if helper function exists and works',
        p_type: 'info'
      });
    
    if (helperError) {
      console.error('❌ Helper function error:', helperError.message);
      console.log('   ⚠️  FIX-TRIGGER-RLS.sql may not be applied!');
    } else {
      console.log('✅ Helper function works! Notification ID:', testHelper);
    }

    // 2. Test lookup functions
    console.log('\n2️⃣ Testing Lookup Functions');
    console.log('-'.repeat(60));
    
    const { data: parentLookup, error: lookupError } = await supabase
      .rpc('get_parent_id_for_family', { p_family_id: familyId });
    
    if (lookupError) {
      console.error('❌ Parent lookup error:', lookupError.message);
      console.log('   ⚠️  FIX-PARENT-LOOKUP.sql may not be applied!');
    } else if (parentLookup) {
      console.log('✅ Parent lookup works! Found:', parentLookup);
    } else {
      console.log('❌ Parent lookup returned null');
      console.log('   ⚠️  Check auth.users family_code data');
    }

    const { data: childName, error: nameError } = await supabase
      .rpc('get_user_name', { p_user_id: childId });
    
    if (nameError) {
      console.error('❌ Name lookup error:', nameError.message);
    } else {
      console.log('✅ Name lookup works! Child name:', childName);
    }

    // 3. Check recent notifications
    console.log('\n3️⃣ Recent Notifications');
    console.log('-'.repeat(60));
    
    const { data: parentNotifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', parentId)
      .order('created_at', { ascending: false })
      .limit(3);
    
    console.log(`Parent has ${parentNotifs?.length || 0} recent notifications:`);
    parentNotifs?.forEach(n => {
      console.log(`  - ${n.title} (${new Date(n.created_at).toLocaleTimeString()})`);
    });

    // 4. Summary
    console.log('\n📋 SUMMARY');
    console.log('='.repeat(60));
    
    const sqlFiles = [];
    if (helperError) sqlFiles.push('FIX-TRIGGER-RLS.sql');
    if (lookupError) sqlFiles.push('FIX-PARENT-LOOKUP.sql');
    
    if (sqlFiles.length > 0) {
      console.log('❌ MISSING SQL FIXES:');
      sqlFiles.forEach(file => {
        console.log(`   - Run ${file} in Supabase SQL Editor`);
      });
    } else if (!parentLookup) {
      console.log('⚠️  PARENT LOOKUP ISSUE:');
      console.log('   - auth.users may not have correct family_code');
      console.log('   - Check raw_user_meta_data->>\'family_code\' matches family_id');
    } else {
      console.log('✅ ALL FUNCTIONS INSTALLED!');
      console.log('   Notifications should work now.');
      console.log('   Test by completing a task in the app.');
    }

  } catch (error) {
    console.error('\n❌ DIAGNOSTIC FAILED:', error);
  }

  process.exit(0);
}

comprehensiveDiagnostic();
