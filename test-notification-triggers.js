const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testNotificationTriggers() {
  console.log('🧪 Testing Notification Triggers\n');
  console.log('=' .repeat(60));

  try {
    // 1. Verify triggers exist
    console.log('\n📋 Step 1: Verifying triggers exist...\n');
    const { data: triggers, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_object_table, event_manipulation')
      .in('event_object_table', ['tasks', 'reward_redemptions']);

    if (triggerError) {
      console.log('⚠️  Cannot query triggers directly, checking functions instead...\n');
    } else if (triggers && triggers.length > 0) {
      console.log(`✅ Found ${triggers.length} triggers:`);
      triggers.forEach(t => {
        console.log(`   - ${t.trigger_name} (${t.event_object_table})`);
      });
    }

    // 2. Get a test family to work with
    console.log('\n📋 Step 2: Finding test data...\n');
    
    // Get a parent user
    const { data: parentUser, error: parentError } = await supabase
      .rpc('get_users_by_role', { role_filter: 'parent' })
      .limit(1)
      .single();

    if (parentError || !parentUser) {
      console.log('⚠️  No parent user found. Need to create test data first.');
      console.log('   Run the app and create a family to test notifications.\n');
      return;
    }

    const familyId = parentUser.raw_user_meta_data?.family_code;
    console.log(`✅ Found parent: ${parentUser.email}`);
    console.log(`   Family ID: ${familyId}\n`);

    // Get a child in the same family
    const { data: childUser, error: childError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .eq('raw_user_meta_data->>family_code', familyId)
      .eq('raw_user_meta_data->>role', 'child')
      .limit(1)
      .single();

    if (childError || !childUser) {
      console.log('⚠️  No child user found in this family.');
      console.log('   Add a child to the family to test notifications.\n');
      return;
    }

    console.log(`✅ Found child: ${childUser.email}\n`);

    // 3. Get current notification count
    console.log('📋 Step 3: Checking current notifications...\n');
    const { data: beforeNotifs, error: beforeError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: false })
      .eq('family_id', familyId);

    const beforeCount = beforeNotifs?.length || 0;
    console.log(`   Current notifications: ${beforeCount}\n`);

    // 4. Test task assignment notification
    console.log('📋 Step 4: Testing task assignment trigger...\n');
    const { data: newTask, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: 'Test Task - Notification Verification',
        description: 'This task tests the notification system',
        points: 50,
        family_id: familyId,
        assigned_to: childUser.id,
        status: 'pending',
        created_by: parentUser.id
      })
      .select()
      .single();

    if (taskError) {
      console.error('❌ Error creating test task:', taskError.message);
      return;
    }

    console.log(`✅ Created test task: "${newTask.title}"`);
    console.log(`   Task ID: ${newTask.id}\n`);

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 5. Check if assignment notification was created
    const { data: assignNotif, error: assignError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', childUser.id)
      .eq('type', 'task')
      .order('created_at', { ascending: false })
      .limit(1);

    if (assignNotif && assignNotif.length > 0) {
      console.log('✅ Task assignment notification created!');
      console.log(`   Title: "${assignNotif[0].title}"`);
      console.log(`   Message: "${assignNotif[0].message}"\n`);
    } else {
      console.log('⚠️  No task assignment notification found.\n');
    }

    // 6. Test task completion notification
    console.log('📋 Step 5: Testing task completion trigger...\n');
    const { error: completeError } = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', newTask.id);

    if (completeError) {
      console.error('❌ Error completing task:', completeError.message);
    } else {
      console.log('✅ Task marked as completed\n');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for parent notification
      const { data: completeNotif } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', parentUser.id)
        .eq('type', 'success')
        .order('created_at', { ascending: false })
        .limit(1);

      if (completeNotif && completeNotif.length > 0) {
        console.log('✅ Task completion notification created!');
        console.log(`   Title: "${completeNotif[0].title}"`);
        console.log(`   Message: "${completeNotif[0].message}"\n`);
      } else {
        console.log('⚠️  No completion notification found.\n');
      }
    }

    // 7. Test task approval notification
    console.log('📋 Step 6: Testing task approval trigger...\n');
    const { error: approvalError } = await supabase
      .from('tasks')
      .update({ status: 'approved' })
      .eq('id', newTask.id);

    if (approvalError) {
      console.error('❌ Error approving task:', approvalError.message);
    } else {
      console.log('✅ Task approved\n');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check for child notification
      const { data: approvalNotif } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', childUser.id)
        .eq('type', 'success')
        .ilike('title', '%approved%')
        .order('created_at', { ascending: false })
        .limit(1);

      if (approvalNotif && approvalNotif.length > 0) {
        console.log('✅ Task approval notification created!');
        console.log(`   Title: "${approvalNotif[0].title}"`);
        console.log(`   Message: "${approvalNotif[0].message}"\n`);
      } else {
        console.log('⚠️  No approval notification found.\n');
      }
    }

    // 8. Final count
    console.log('📋 Step 7: Final notification count...\n');
    const { data: afterNotifs } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('family_id', familyId);

    const afterCount = afterNotifs?.length || 0;
    const newNotifications = afterCount - beforeCount;

    console.log(`   Before: ${beforeCount} notifications`);
    console.log(`   After: ${afterCount} notifications`);
    console.log(`   New: ${newNotifications} notifications created\n`);

    // 9. Cleanup
    console.log('🧹 Cleaning up test data...\n');
    await supabase.from('tasks').delete().eq('id', newTask.id);
    console.log('✅ Test task deleted\n');

    console.log('=' .repeat(60));
    console.log('\n🎉 Notification trigger test complete!\n');
    
    if (newNotifications >= 3) {
      console.log('✅ SUCCESS: All triggers are working correctly!');
      console.log('   Notifications were created for:');
      console.log('   • Task assignment');
      console.log('   • Task completion');
      console.log('   • Task approval\n');
    } else if (newNotifications > 0) {
      console.log('⚠️  PARTIAL: Some triggers worked, but not all.');
      console.log(`   Expected 3 notifications, got ${newNotifications}\n`);
    } else {
      console.log('❌ FAILED: No notifications were created.');
      console.log('   Check trigger installation and RLS policies.\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testNotificationTriggers();
