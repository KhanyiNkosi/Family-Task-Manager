const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function comprehensiveTest() {
  console.log('🎯 Comprehensive Task & Notification Test\n');
  console.log('=' .repeat(70));

  try {
    const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
    const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

    // Get parent
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('family_id', familyId)
      .limit(1)
      .single();

    const parentId = parentProfile?.id;

    console.log('\n📋 Setup:');
    console.log(`   Child: ${childId}`);
    console.log(`   Parent: ${parentId}`);
    console.log(`   Family: ${familyId}\n`);

    // Get notification count before
    const { data: beforeNotifs } = await supabase
      .from('notifications')
      .select('id');
    const beforeCount = beforeNotifs?.length || 0;

    console.log(`Starting notifications: ${beforeCount}\n`);
    console.log('=' .repeat(70));

    // Find an incomplete task
    const { data: incompleteTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', childId)
      .eq('completed', false)
      .limit(1)
      .single();

    if (!incompleteTask) {
      console.log('\n⚠️  No incomplete tasks found. Testing with completed task...\n');
      
      // Get any task and reset it
      const { data: anyTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', childId)
        .limit(1)
        .single();

      if (!anyTask) {
        console.log('❌ No tasks found for testing!\n');
        return;
      }

      // Reset the task
      await supabase
        .from('tasks')
        .update({ completed: false, approved: false, completed_at: null })
        .eq('id', anyTask.id);

      console.log(`   Reset task: "${anyTask.title}"\n`);
      
      // Wait a moment
      await new Promise(r => setTimeout(r, 500));

      // Test with this task
      testTaskId = anyTask.id;
      testTaskTitle = anyTask.title;
      testTaskPoints = anyTask.points;
    } else {
      testTaskId = incompleteTask.id;
      testTaskTitle = incompleteTask.title;
      testTaskPoints = incompleteTask.points;
    }

    console.log(`\n🧪 Testing with: "${testTaskTitle}" (${testTaskPoints} pts)\n`);
    console.log('=' .repeat(70));

    // TEST 1: Complete the task (child action)
    console.log('\n✅ TEST 1: Child Completes Task\n');
    
    const { data: completedData, error: completeError } = await supabase
      .from('tasks')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', testTaskId)
      .select();

    if (completeError) {
      console.error('   ❌ Failed:', completeError.message);
    } else {
      console.log('   ✅ Task marked as completed');
      console.log('   📝 Updated data:', completedData);
      
      // Wait for trigger
      await new Promise(r => setTimeout(r, 2000));
      
      // Check for parent notification
      const { data: parentNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', parentId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (parentNotifs && parentNotifs.length > 0) {
        const notif = parentNotifs[0];
        const isNew = new Date(notif.created_at) > new Date(Date.now() - 5000);
        
        if (isNew) {
          console.log('   🔔 ✅ Parent notification created!');
          console.log(`      Title: "${notif.title}"`);
          console.log(`      Message: "${notif.message}"`);
          console.log(`      Type: ${notif.type}\n`);
        } else {
          console.log('   ⚠️  Found notification but it\'s old (not from this test)\n');
        }
      } else {
        console.log('   ❌ No parent notification found');
        console.log('   💡 Check: Does parent exist in profiles table?\n');
      }
    }

    // TEST 2: Approve the task (parent action)
    console.log('✅ TEST 2: Parent Approves Task\n');
    
    const { data: approvedData, error: approveError } = await supabase
      .from('tasks')
      .update({ approved: true })
      .eq('id', testTaskId)
      .select();

    if (approveError) {
      console.error('   ❌ Failed:', approveError.message);
    } else {
      console.log('   ✅ Task approved');
      console.log('   📝 Updated data:', approvedData);
      
      // Wait for trigger
      await new Promise(r => setTimeout(r, 2000));
      
      // Check for child notification
      const { data: childNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', childId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (childNotifs && childNotifs.length > 0) {
        const notif = childNotifs[0];
        const isNew = new Date(notif.created_at) > new Date(Date.now() - 5000);
        
        if (isNew) {
          console.log('   🔔 ✅ Child notification created!');
          console.log(`      Title: "${notif.title}"`);
          console.log(`      Message: "${notif.message}"`);
          console.log(`      Type: ${notif.type}\n`);
        } else {
          console.log('   ⚠️  Found notification but it\'s old\n');
        }
      } else {
        console.log('   ❌ No child notification found\n');
      }
    }

    // Final count
    console.log('=' .repeat(70));
    const { data: afterNotifs } = await supabase
      .from('notifications')
      .select('id');
    const afterCount = afterNotifs?.length || 0;
    const newCount = afterCount - beforeCount;

    console.log(`\n📊 Results:`);
    console.log(`   Before: ${beforeCount} notifications`);
    console.log(`   After: ${afterCount} notifications`);
    console.log(`   New: ${newCount} created\n`);

    if (newCount >= 2) {
      console.log('🎉 SUCCESS! Both triggers working perfectly!');
    } else if (newCount === 1) {
      console.log('⚠️  PARTIAL: One trigger working');
    } else {
      console.log('❌ No new notifications created');
    }

    console.log('\n✅ All systems tested!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

comprehensiveTest();
