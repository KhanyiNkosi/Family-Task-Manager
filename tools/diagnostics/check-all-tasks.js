import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHILD_ID = '17eb2a70-6fef-4f01-8303-03883c92e705';

async function checkAllTasks() {
  console.log('\n🔍 Checking ALL Tasks for Child (Approved & Not Approved)\n');
  console.log('='.repeat(60));

  // Get ALL tasks for this child
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', CHILD_ID)
    .order('created_at', { ascending: false });

  console.log(`\nTotal tasks assigned to child: ${allTasks?.length || 0}\n`);

  if (allTasks && allTasks.length > 0) {
    const approved = allTasks.filter(t => t.approved);
    const pending = allTasks.filter(t => t.completed && !t.approved);
    const notCompleted = allTasks.filter(t => !t.completed);

    console.log('📊 TASK BREAKDOWN:\n');
    
    console.log(`✅ Approved (${approved.length}):`);
    approved.forEach(t => {
      console.log(`   [${t.points}pts] ${t.title}`);
      console.log(`      Created: ${new Date(t.created_at).toLocaleDateString()}, Completed: ${t.completed_at ? new Date(t.completed_at).toLocaleDateString() : 'N/A'}`);
    });
    const approvedTotal = approved.reduce((sum, t) => sum + (t.points || 0), 0);
    console.log(`   Total: ${approvedTotal} points\n`);

    if (pending.length > 0) {
      console.log(`⏳ Pending Approval (${pending.length}):`);
      pending.forEach(t => {
        console.log(`   [${t.points}pts] ${t.title}`);
        console.log(`      Completed: ${t.completed_at ? new Date(t.completed_at).toLocaleDateString() : 'N/A'}`);
      });
      console.log('');
    }

    if (notCompleted.length > 0) {
      console.log(`📝 Not Completed (${notCompleted.length}):`);
      notCompleted.forEach(t => {
        console.log(`   [${t.points}pts] ${t.title}`);
      });
      console.log('');
    }
  }

  // Check if there are tasks that were deleted/modified
  console.log('🔍 LOOKING FOR MISSING TASKS:\n');
  const expectedTasks = ['Project', 'Maths', 'Home Work', 'Walk dog', 'Test Task'];
  
  for (const taskName of expectedTasks) {
    const found = allTasks?.find(t => t.title.includes(taskName) || taskName.includes(t.title));
    if (found) {
      console.log(`   ✅ "${taskName}" - Status: ${found.approved ? 'APPROVED' : found.completed ? 'PENDING' : 'NOT COMPLETED'} (${found.points}pts)`);
    } else {
      console.log(`   ❌ "${taskName}" - NOT FOUND (may have been deleted or renamed)`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Complete\n');
}

checkAllTasks().catch(console.error);
