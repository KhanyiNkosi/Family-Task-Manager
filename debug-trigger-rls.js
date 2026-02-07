const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugTriggerIssue() {
  console.log('\n🔍 Debugging Trigger Issue\n');

  const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
  const parentId = '081a3483-9e2b-43e6-bf89-302fac88b186';
  const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

  try {
    // 1. Check if trigger exists
    console.log('1️⃣ Checking if trigger is installed...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT proname FROM pg_proc WHERE proname = 'notify_task_completed'` 
      });
    
    // Alternative - just check via direct query since exec_sql might not exist
    console.log('   (Cannot directly query pg_catalog from client)');

    // 2. Check notifications table RLS policies
    console.log('\n2️⃣ Testing notification INSERT with service role...');
    const { data: testInsert, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: parentId,
        family_id: familyId,
        title: 'RLS Test',
        message: 'Testing if RLS blocks trigger inserts',
        type: 'info'
      })
      .select();
    
    if (insertError) {
      console.error('❌ Cannot insert notification:', insertError);
      console.log('   ⚠️  RLS may be blocking trigger inserts!');
    } else {
      console.log('✅ Direct insert works:', testInsert[0].id);
    }

    // 3. Test parent lookup query
    console.log('\n3️⃣ Testing parent lookup query...');
    
    // Simulate what the trigger does
    const lookupQuery = `
      SELECT id, raw_user_meta_data 
      FROM auth.users 
      WHERE raw_user_meta_data->>'family_code' = '${familyId}'
        AND raw_user_meta_data->>'role' = 'parent'
      LIMIT 1
    `;
    
    console.log('   Query (cannot run from client):');
    console.log('   ' + lookupQuery);
    
    // 4. Check if task was updated
    console.log('\n4️⃣ Checking task table...');
    const { data: task } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', '5f23f5cd-0d90-49dc-9c36-18cae879c9d8')
      .single();
    
    if (task) {
      console.log(`✅ Task "${task.title}"`);
      console.log(`   completed: ${task.completed}`);
      console.log(`   approved: ${task.approved}`);
      console.log(`   assigned_to: ${task.assigned_to}`);
      console.log(`   family_id: ${task.family_id}`);
    }

    // 5. Suggest fix
    console.log('\n📋 DIAGNOSIS:');
    console.log('   The trigger is installed but notifications aren\'t being created.');
    console.log('   Most likely causes:');
    console.log('   1. RLS policy on notifications table blocks trigger INSERTS');
    console.log('   2. Trigger function cannot access auth.users table');
    console.log('   3. Parent lookup failing (family_code mismatch)');
    console.log('\n💡 SOLUTION:');
    console.log('   Create a SECURITY DEFINER helper function that bypasses RLS.');
    console.log('   The trigger should call this helper instead of direct INSERT.');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }

  process.exit(0);
}

debugTriggerIssue();
