import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug409Error() {
  console.log('\n🔍 Debugging 409 Task Completion Error\n');
  console.log('='.repeat(60));

  // 1. Check tasks table columns
  console.log('\n1️⃣ TASKS TABLE STRUCTURE:');
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .limit(1);

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  } else if (tasks && tasks.length > 0) {
    console.log('   Available columns:', Object.keys(tasks[0]).join(', '));
  }

  // 2. Check for unique constraints
  console.log('\n2️⃣ CHECKING FOR UNIQUE CONSTRAINTS:');
  const { data: constraints, error: constraintsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'tasks'::regclass;
    `
  });

  if (constraintsError) {
    console.log('   ⚠️  Cannot check constraints (requires exec_sql function)');
  } else {
    console.log('   Constraints:', constraints);
  }

  // 3. Try to simulate the update
  console.log('\n3️⃣ TESTING TASK UPDATE:');
  const testTaskId = '9335ac7a-3876-4a7d-bdc0-80b3ead6f37a'; // From the error logs
  
  const { data: taskBefore, error: fetchError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', testTaskId)
    .single();

  if (fetchError) {
    console.log('   Task not found or error:', fetchError.message);
  } else {
    console.log('   Task BEFORE update:');
    console.log('     - completed:', taskBefore.completed);
    console.log('     - completed_at:', taskBefore.completed_at);
    console.log('     - photo_url:', taskBefore.photo_url);
    console.log('     - photo_uploaded_at:', taskBefore.photo_uploaded_at || 'N/A');
  }

  // 4. Check activity_feed for duplicates
  console.log('\n4️⃣ CHECKING ACTIVITY FEED:');
  const { data: activities, error: activitiesError } = await supabase
    .from('activity_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (activitiesError) {
    console.error('Error fetching activities:', activitiesError);
  } else {
    console.log(`   Total recent activities: ${activities?.length || 0}`);
    if (activities && activities.length > 0) {
      activities.forEach((a, idx) => {
        console.log(`   ${idx + 1}. [${a.activity_type}] ${a.title} - ${new Date(a.created_at).toLocaleString()}`);
      });
    }
  }

  // 5. Check if task_completion_activity trigger is working
  console.log('\n5️⃣ RECOMMENDATION:');
  if (taskBefore && taskBefore.completed) {
    console.log('   ⚠️  Task is already completed!');
    console.log('   The 409 error might be because:');
    console.log('     1. Child is clicking "Complete" multiple times');
    console.log('     2. Trigger is trying to insert duplicate activity');
    console.log('     3. Activity feed has UNIQUE constraint on task_id');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic Complete\n');
}

debug409Error().catch(console.error);
