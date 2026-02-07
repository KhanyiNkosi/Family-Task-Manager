// Quick diagnostic to detect the trigger issue
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function detectTriggerIssue() {
  console.log('\n🔍 Detecting Trigger Issue...\n');

  try {
    // Try to update a task
    const { data: testTask } = await supabase
      .from('tasks')
      .select('id, completed, approved')
      .limit(1)
      .single();

    if (!testTask) {
      console.log('⚠️  No tasks found to test with.\n');
      return;
    }

    console.log(`Testing with task ID: ${testTask.id}`);
    console.log(`Current state: completed=${testTask.completed}, approved=${testTask.approved}\n`);

    // Try a harmless update
    const { error } = await supabase
      .from('tasks')
      .update({ completed: testTask.completed }) // Same value, no real change
      .eq('id', testTask.id);

    if (error) {
      if (error.message.includes('has no field "status"')) {
        console.log('🚨 ISSUE DETECTED: Triggers not updated!\n');
        console.log('═'.repeat(60));
        console.log('ERROR: record "new" has no field "status"');
        console.log('═'.repeat(60));
        console.log('\n❌ Problem: Database triggers still use old field names');
        console.log('✅ Solution: Run URGENT-FIX-TRIGGERS.sql in Supabase\n');
        console.log('Steps:');
        console.log('  1. Open: https://eailwpyubcopzikpblep.supabase.co');
        console.log('  2. Go to: SQL Editor');
        console.log('  3. Copy-paste: URGENT-FIX-TRIGGERS.sql');
        console.log('  4. Click: Run\n');
        console.log('This will fix:');
        console.log('  • Task completion');
        console.log('  • Task approval');
        console.log('  • Help request resolution');
        console.log('  • All notifications\n');
      } else {
        console.log('❌ Different error:', error.message);
      }
    } else {
      console.log('✅ No trigger issue detected!');
      console.log('   Task updates are working correctly.\n');
      console.log('If you\'re still having issues, check:');
      console.log('  • Browser console for JavaScript errors');
      console.log('  • RLS policies allow your user to update tasks');
      console.log('  • Network tab for API failures\n');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

detectTriggerIssue();
