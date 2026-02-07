const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnoseTaskIssues() {
  console.log('🔍 Diagnosing Task & Notification Issues\n');
  console.log('=' .repeat(70));

  try {
    const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';

    // 1. Check actual tasks table structure by querying a task
    console.log('\n📋 Step 1: Checking tasks table structure...\n');

    const { data: sampleTask, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', childId)
      .limit(1)
      .single();

    if (taskError) {
      console.error('❌ Error fetching task:', taskError.message);
    } else if (sampleTask) {
      console.log('✅ Sample task structure:');
      console.log('   Fields present:', Object.keys(sampleTask).join(', '));
      console.log('\n   Sample data:');
      console.log(`     ID: ${sampleTask.id}`);
      console.log(`     Title: ${sampleTask.title}`);
      console.log(`     Status field: ${sampleTask.status || 'NOT PRESENT'}`);
      console.log(`     Task_status field: ${sampleTask.task_status || 'NOT PRESENT'}`);
      console.log(`     Completed field: ${sampleTask.completed !== undefined ? sampleTask.completed : 'NOT PRESENT'}`);
      console.log(`     Approved field: ${sampleTask.approved !== undefined ? sampleTask.approved : 'NOT PRESENT'}`);
      console.log('');
    }

    // 2. Try to complete a task (simulate child action)
    console.log('📋 Step 2: Testing task completion...\n');

    const testTask = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', childId)
      .limit(1)
      .single();

    if (testTask.data) {
      console.log(`   Testing with task: "${testTask.data.title}"`);
      
      // Try different field combinations to see which works
      const updatePayloads = [
        { status: 'completed', completed_at: new Date().toISOString() },
        { task_status: 'completed', completed_at: new Date().toISOString() },
        { completed: true, completed_at: new Date().toISOString() },
      ];

      for (let i = 0; i < updatePayloads.length; i++) {
        const payload = updatePayloads[i];
        console.log(`\n   Attempting update ${i + 1}:`, JSON.stringify(payload));
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update(payload)
          .eq('id', testTask.data.id);

        if (updateError) {
          console.log(`   ❌ Failed:`, updateError.message);
        } else {
          console.log(`   ✅ Success! This field combination works.`);
          
          // Check if notification was created
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: notifications } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);

          if (notifications && notifications.length > 0) {
            console.log(`   🔔 Notification created!`);
            console.log(`      Title: "${notifications[0].title}"`);
            console.log(`      Type: ${notifications[0].type}`);
          } else {
            console.log(`   ⚠️  No notification created`);
          }
          
          // Revert the change
          await supabase
            .from('tasks')
            .update({ 
              status: null, 
              task_status: 'pending', 
              completed: false,
              completed_at: null 
            })
            .eq('id', testTask.data.id);
          
          break;
        }
      }
    }

    // 3. Check notifications table
    console.log('\n\n📋 Step 3: Checking notifications...\n');

    const { data: allNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError.message);
    } else if (!allNotifications || allNotifications.length === 0) {
      console.log('⚠️  No notifications found in database');
      console.log('   This means triggers are not firing.');
    } else {
      console.log(`✅ Found ${allNotifications.length} recent notification(s):`);
      allNotifications.forEach((notif, idx) => {
        console.log(`\n   ${idx + 1}. ${notif.title}`);
        console.log(`      Message: ${notif.message}`);
        console.log(`      Type: ${notif.type}`);
        console.log(`      User ID: ${notif.user_id}`);
        console.log(`      Created: ${new Date(notif.created_at).toLocaleString()}`);
      });
    }

    // 4. Verify triggers exist
    console.log('\n\n📋 Step 4: Checking trigger status...\n');
    
    const { data: triggerCheck } = await supabase
      .rpc('check_triggers')
      .catch(() => ({ data: null }));

    if (triggerCheck) {
      console.log('✅ Triggers verified via RPC');
    } else {
      console.log('⚠️  Cannot verify triggers (RPC not available)');
      console.log('   Triggers were installed, but we cannot query them from app.');
    }

    console.log('\n\n=' .repeat(70));
    console.log('\n💡 DIAGNOSIS SUMMARY\n');
    
    if (sampleTask) {
      const hasStatus = sampleTask.status !== undefined;
      const hasTaskStatus = sampleTask.task_status !== undefined;
      const hasCompleted = sampleTask.completed !== undefined;

      console.log('Field Mapping Issue:');
      console.log(`   • tasks.status exists: ${hasStatus ? '✅' : '❌'}`);
      console.log(`   • tasks.task_status exists: ${hasTaskStatus ? '✅' : '❌'}`);
      console.log(`   • tasks.completed exists: ${hasCompleted ? '✅' : '❌'}\n`);

      if (!hasStatus && hasTaskStatus) {
        console.log('⚠️  ISSUE FOUND: Table uses "task_status" but code uses "status"');
        console.log('   Solution: Update the code to use "task_status" field\n');
      } else if (hasCompleted && !hasStatus) {
        console.log('⚠️  ISSUE FOUND: Table uses boolean "completed" but triggers expect "status"');
        console.log('   Solution: Add "status" column or update triggers\n');
      }
    }

  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error.message);
    console.error(error);
  }
}

diagnoseTaskIssues();
