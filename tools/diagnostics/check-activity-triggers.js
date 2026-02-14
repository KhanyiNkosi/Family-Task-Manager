import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActivityTriggers() {
  console.log('\n🔍 Checking Activity Feed Triggers...\n');

  // Check if activity_feed table exists
  const { data: tables, error: tablesError } = await supabase
    .from('activity_feed')
    .select('id')
    .limit(1);

  if (tablesError) {
    console.log('❌ activity_feed table does NOT exist');
    console.log('   Error:', tablesError.message);
    console.log('\n📝 ACTION REQUIRED: Run create-activity-feed-system-v2.sql in Supabase SQL Editor\n');
    return;
  }

  console.log('✅ activity_feed table exists');

  // Check for triggers
  const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT trigger_name, event_manipulation, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name IN (
        'task_completion_activity_trigger',
        'task_approval_activity_trigger',
        'achievement_earned_activity_trigger'
      )
      ORDER BY trigger_name;
    `
  });

  if (triggersError) {
    console.log('⚠️  Could not check triggers (requires exec_sql function)');
    console.log('   Checking manually via activity count...');
    
    // Alternative check: see if any activities exist
    const { count } = await supabase
      .from('activity_feed')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Activity Feed Status:`);
    console.log(`   Total activities: ${count || 0}`);
    
    if (count === 0) {
      console.log('\n❌ No activities found');
      console.log('   This suggests triggers are NOT working or were never created');
      console.log('\n📝 ACTION REQUIRED: Run create-activity-feed-system-v2.sql in Supabase SQL Editor\n');
    }
    return;
  }

  console.log('\n📊 Activity Feed Triggers:');
  triggers?.forEach(t => {
    console.log(`   ✅ ${t.trigger_name} on ${t.event_object_table}`);
  });

  if (!triggers || triggers.length === 0) {
    console.log('   ❌ No activity triggers found');
    console.log('\n📝 ACTION REQUIRED: Run create-activity-feed-system-v2.sql in Supabase SQL Editor\n');
  } else if (triggers.length < 3) {
    console.log(`\n⚠️  Only ${triggers.length}/3 triggers found`);
    console.log('📝 ACTION REQUIRED: Run create-activity-feed-system-v2.sql in Supabase SQL Editor\n');
  } else {
    console.log('\n✅ All activity triggers are configured!\n');
  }
}

checkActivityTriggers().catch(console.error);
