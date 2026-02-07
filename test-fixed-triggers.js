const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testFixedTriggers() {
  console.log('🧪 Testing Fixed Notification Triggers\n');
  console.log('=' .repeat(70));

  try {
    const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
    const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

    // Get parent ID
    const { data: parentProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('family_id', familyId)
      .limit(1)
      .single();

    const parentId = parentProfile?.id;
    console.log('\n📋 Test Setup:');
    console.log(`   Child ID: ${childId}`);
    console.log(`   Parent ID: ${parentId || 'Not found'}`);
    console.log(`   Family ID: ${familyId}\n`);

    // Get current notification count
    const { data: beforeNotifs } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' });
    const beforeCount = beforeNotifs?.length || 0;

    console.log(`Starting notification count: ${beforeCount}\n`);
    console.log('=' .repeat(70));

    // TEST 1: Task completion
    console.log('\n✅ TEST 1: Task Completion Trigger\n');
    
    const { data: testTask } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', childId)
      .eq('completed', false)
      .limit(1)
      .single();

    if (!testTask) {
      console.log('⚠️  No uncompleted tasks found for testing');
    } else {
      console.log(`   Testing with: "${testTask.title}"`);
      
      // Mark as completed (child action)
      const { error: completeError } = await supabase
        .from('tasks')
        .update({ 
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', testTask.id);

      if (completeError) {
        console.error('   ❌ Failed to complete task:', completeError.message);
      } else {
        console.log('   ✅ Task marked as completed');
        
        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check for notification
        const { data: completionNotif } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', parentId)
          .ilike('title', '%completed%')
          .order('created_at', { ascending: false })
          .limit(1);

        if (completionNotif && completionNotif.length > 0 &&
            new Date(completionNotif[0].created_at) > new Date(Date.now() - 5000)) {
          console.log('   🔔 ✅ Notification created for parent!');
          console.log(`      Title: "${completionNotif[0].title}"`);
          console.log(`      Message: "${completionNotif[0].message}"\n`);
        } else {
          console.log('   ❌ No completion notification found\n');
        }

        // TEST 2: Task approval
        console.log('✅ TEST 2: Task Approval Trigger\n');
        
        const { error: approveError } = await supabase
          .from('tasks')
          .update({ approved: true })
          .eq('id', testTask.id);

        if (approveError) {
          console.error('   ❌ Failed to approve task:', approveError.message);
        } else {
          console.log('   ✅ Task approved');
          
          // Wait for trigger
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Check for notification
          const { data: approvalNotif } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', childId)
            .ilike('title', '%approved%')
            .order('created_at', { ascending: false })
            .limit(1);

          if (approvalNotif && approvalNotif.length > 0 &&
              new Date(approvalNotif[0].created_at) > new Date(Date.now() - 5000)) {
            console.log('   🔔 ✅ Notification created for child!');
            console.log(`      Title: "${approvalNotif[0].title}"`);
            console.log(`      Message: "${approvalNotif[0].message}"\n`);
          } else {
            console.log('   ❌ No approval notification found\n');
          }
        }

        // Reset task for future tests
        console.log('   🧹 Resetting task to original state...');
        await supabase
          .from('tasks')
          .update({ 
            completed: false,
            approved: false,
            completed_at: null
          })
          .eq('id', testTask.id);
      }
    }

    // Final count
    console.log('\n=' .repeat(70));
    const { data: afterNotifs } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' });
    const afterCount = afterNotifs?.length || 0;
    const newNotifs = afterCount - beforeCount;

    console.log(`\n📊 Final Results:`);
    console.log(`   Before: ${beforeCount} notifications`);
    console.log(`   After: ${afterCount} notifications`);
    console.log(`   New: ${newNotifs} notifications created\n`);

    if (newNotifs >= 2) {
      console.log('🎉 SUCCESS! Both triggers are working!');
      console.log('   ✅ Task completion notifications');
      console.log('   ✅ Task approval notifications\n');
    } else if (newNotifs === 1) {
      console.log('⚠️  PARTIAL SUCCESS: Only 1 trigger working');
      console.log('   Check which notification was created above.\n');
    } else {
      console.log('❌ FAILED: No notifications created');
      console.log('   Make sure you ran fix-notification-triggers.sql\n');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testFixedTriggers();
