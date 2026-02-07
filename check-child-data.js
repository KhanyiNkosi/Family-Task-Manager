// Check if child data exists in the database
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChildData() {
  console.log('🔍 Checking child data in database...\n');

  // Check if there are any tasks
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, assigned_to, points, completed')
    .limit(10);

  if (tasksError) {
    console.error('❌ Error fetching tasks:', tasksError.message);
  } else {
    console.log(`📋 Found ${tasks?.length || 0} tasks in database`);
    if (tasks && tasks.length > 0) {
      console.log('Sample tasks:');
      tasks.forEach(task => {
        console.log(`  - ${task.title} (${task.points} pts) - Assigned to: ${task.assigned_to || 'unassigned'}`);
      });
    }
  }

  console.log('');

  // Check profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, family_id');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError.message);
  } else {
    console.log(`👥 Found ${profiles?.length || 0} profiles`);
    if (profiles && profiles.length > 0) {
      profiles.forEach(p => {
        console.log(`  - ${p.email} | Family: ${p.family_id || 'none'}`);
      });
    }
  }

  console.log('');

  // Check user_profiles (points)
  const { data: userProfiles, error: upError } = await supabase
    .from('user_profiles')
    .select('id, role, total_points');

  if (upError) {
    console.error('❌ Error fetching user_profiles:', upError.message);
  } else {
    console.log(`📊 Found ${userProfiles?.length || 0} user_profiles`);
    if (userProfiles && userProfiles.length > 0) {
      userProfiles.forEach(up => {
        console.log(`  - User: ${up.id} | Role: ${up.role} | Points: ${up.total_points}`);
      });
    }
  }

  console.log('');

  // Check rewards
  const { data: rewards, error: rewardsError } = await supabase
    .from('rewards')
    .select('id, title, points_cost, family_id, is_active');

  if (rewardsError) {
    console.error('❌ Error fetching rewards:', rewardsError.message);
  } else {
    console.log(`🎁 Found ${rewards?.length || 0} rewards`);
    if (rewards && rewards.length > 0) {
      rewards.forEach(r => {
        console.log(`  - ${r.title} (${r.points_cost} pts) - Family: ${r.family_id} - Active: ${r.is_active}`);
      });
    }
  }
}

checkChildData().then(() => {
  console.log('\n✅ Check complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
