const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCompleteFlow() {
  console.log('\n🧪 Testing Task Completion Notification Flow\n');

  const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
  const parentId = '081a3483-9e2b-43e6-bf89-302fac88b186';
  const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

  try {
    // 1. Get existing notification count
    const { data: beforeNotifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', parentId);
    
    console.log(`📊 Parent has ${beforeNotifs.length} notifications before test`);

    // 2. Find a pending task
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', childId)
      .eq('completed', false)
      .limit(1);

    if (!tasks || tasks.length === 0) {
      console.log('⚠️  No pending tasks found. Creating one...');
      
      const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: 'Test Task for Notification',
          description: 'Testing completion notification',
          points: 10,
          assigned_to: childId,
          created_by: parentId,
          family_id: familyId,
          category: 'general',
          completed: false,
          approved: false
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating task:', createError);
        return;
      }
      
      console.log('✅ Created test task:', newTask.id);
      
      // Wait for trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if child got notification
      const { data: childNotifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', childId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (childNotifs && childNotifs.length > 0 && childNotifs[0].title.includes('Task Assigned')) {
        console.log('✅ Task assignment notification created for child');
      } else {
        console.log('❌ No assignment notification found');
      }
      
      tasks[0] = newTask;
    }

    const testTask = tasks[0];
    console.log(`\n📝 Testing with task: "${testTask.title}" (ID: ${testTask.id})`);

    // 3. Mark task as completed (simulate child action)
    console.log('\n🔄 Marking task as completed...');
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', testTask.id);

    if (updateError) {
      console.error('❌ Error updating task:', updateError);
      return;
    }

    console.log('✅ Task marked as completed');

    // Wait for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Check if parent got notification
    const { data: afterNotifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', parentId)
      .order('created_at', { ascending: false });

    console.log(`\n📊 Parent now has ${afterNotifs.length} notifications`);
    
    const newNotification = afterNotifs.find(n => 
      n.message.includes(testTask.title) && 
      n.created_at > new Date(Date.now() - 5000).toISOString()
    );

    if (newNotification) {
      console.log('✅✅✅ COMPLETION NOTIFICATION CREATED!');
      console.log(`   Title: ${newNotification.title}`);
      console.log(`   Message: ${newNotification.message}`);
      console.log(`   Created: ${newNotification.created_at}`);
    } else {
      console.log('❌ No completion notification found for parent');
      console.log('\n🔍 Most recent parent notification:');
      if (afterNotifs[0]) {
        console.log(`   ${afterNotifs[0].title}: ${afterNotifs[0].message}`);
      }
      console.log('\n⚠️  The completion trigger may not be installed!');
      console.log('   👉 Run URGENT-FIX-TRIGGERS.sql in Supabase SQL Editor');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testCompleteFlow();
