const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testTriggerDirectly() {
  console.log('\n🧪 Testing Trigger Directly\n');

  const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
  const parentId = '081a3483-9e2b-43e6-bf89-302fac88b186';
  const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

  try {
    // Count parent notifications before
    const { data: beforeNotifs } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', parentId);

    console.log(`📊 Parent has ${beforeNotifs.length} notifications`);

    // Create a brand new task that's definitely not completed
    console.log('\n1️⃣ Creating fresh task (completed=false)...');
    const { data: task, error: createError } = await supabase
      .from('tasks')
      .insert({
        title: 'Trigger Test Task ' + Date.now(),
        description: 'Testing if completion trigger fires',
        points: 5,
        assigned_to: childId,
        created_by: parentId,
        family_id: familyId,
        category: 'general',
        completed: false,
        approved: false,
        help_requested: false
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Create error:', createError);
      return;
    }

    console.log(`✅ Created task: ${task.id}`);
    console.log(`   completed: ${task.completed}`);
    console.log(`   approved: ${task.approved}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if child got assignment notification
    const { data: childNotifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', childId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (childNotifs[0]?.title.includes('Task Assigned')) {
      console.log('✅ Assignment trigger worked - child got notification');
    }

    // Now mark it as completed (this should trigger parent notification)
    console.log('\n2️⃣ Marking task as completed (completed=true)...');
    const { data: updated, error: updateError } = await supabase
      .from('tasks')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', task.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return;
    }

    console.log(`✅ Task updated: ${updated.id}`);
    console.log(`   completed: ${updated.completed}`);

    // Wait for trigger to fire
    console.log('\n3️⃣ Waiting for trigger (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check parent notifications
    const { data: afterNotifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', parentId)
      .order('created_at', { ascending: false});

    console.log(`📊 Parent now has ${afterNotifs.length} notifications\n`);

    const newNotif = afterNotifs.find(n => 
      n.title === 'Task Completed!' &&
      n.message.includes(task.title)
    );

    if (newNotif) {
      console.log('✅✅✅ SUCCESS! Completion notification created!');
      console.log(`   ID: ${newNotif.id}`);
      console.log(`   Title: ${newNotif.title}`);
      console.log(`   Message: ${newNotif.message}`);
      console.log(`   Created: ${newNotif.created_at}`);
    } else {
      console.log('❌ NO COMPLETION NOTIFICATION FOUND');
      console.log('\n🔍 Most recent parent notifications:');
      afterNotifs.slice(0, 3).forEach(n => {
        console.log(`   - ${n.title}: ${n.message.substring(0, 50)}...`);
      });
      
      console.log('\n⚠️  POSSIBLE CAUSES:');
      console.log('   1. Trigger not installed/enabled');
      console.log('   2. Trigger function has error (check Postgres logs)');
      console.log('   3. Parent lookup failing inside trigger');
      console.log('\n💡 Next step: Check Supabase Postgres logs for warnings');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testTriggerDirectly();
