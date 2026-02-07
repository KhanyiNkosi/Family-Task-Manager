const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testNotificationSystem() {
  console.log('\n🔍 Testing Notification System...\n');

  try {
    // 1. Check if triggers exist
    console.log('1️⃣ Checking database triggers...');
    const { data: triggers, error: triggerError } = await supabase.rpc('pg_get_triggerdef', {});
    
    // Alternative: Query pg_trigger
    const { data: triggerList, error: listError } = await supabase
      .from('pg_trigger')
      .select('tgname')
      .like('tgname', '%notification%');
    
    console.log('Trigger check result:', triggerList || triggerError || listError);

    // 2. Check notifications table
    console.log('\n2️⃣ Checking notifications table...');
    const { data: notifs, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError);
    } else {
      console.log(`✅ Found ${notifs.length} recent notifications`);
      notifs.forEach(n => {
        console.log(`  - ${n.title}: ${n.message} (${n.created_at})`);
      });
    }

    // 3. Check tasks table structure
    console.log('\n3️⃣ Checking tasks table structure...');
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);
    
    if (taskError) {
      console.error('❌ Error fetching tasks:', taskError);
    } else if (tasks.length > 0) {
      console.log('✅ Task fields:', Object.keys(tasks[0]));
      console.log('   Has completed field:', 'completed' in tasks[0]);
      console.log('   Has approved field:', 'approved' in tasks[0]);
      console.log('   Has status field:', 'status' in tasks[0]);
    }

    // 4. Test notification creation directly
    console.log('\n4️⃣ Testing direct notification creation...');
    const { data: authData } = await supabase.auth.getSession();
    
    const { data: testNotif, error: createError } = await supabase
      .from('notifications')
      .insert({
        user_id: '081a3483-9e2b-43e6-bf89-302fac88b186', // Parent ID
        family_id: '32af85db-12f6-4d60-9995-f585aa973ba3',
        title: 'Test Notification',
        message: 'Testing notification system',
        type: 'info',
        action_url: '/parent-dashboard'
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating test notification:', createError);
    } else {
      console.log('✅ Test notification created:', testNotif.id);
    }

    // 5. Check auth.users for family_code
    console.log('\n5️⃣ Checking user metadata...');
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id, raw_user_meta_data')
      .limit(5);
    
    console.log('User check:', userError ? userError.message : 'Cannot query auth.users directly');

    console.log('\n✅ Diagnostic complete!\n');
    console.log('📋 Next Steps:');
    console.log('   1. Run URGENT-FIX-TRIGGERS.sql in Supabase SQL Editor');
    console.log('   2. Refresh the app and test task completion');
    console.log('   3. Check if notifications appear in the UI');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testNotificationSystem();
