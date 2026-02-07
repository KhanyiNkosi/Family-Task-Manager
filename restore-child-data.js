// Restore child test data
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('Please make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Use service role client to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function restoreChildData() {
  console.log('🔧 Restoring child test data...\n');

  // Get the currently logged in user (should be the child)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('❌ No user logged in. Please log in first.');
    console.log('Open your app and log in, then run this script again.');
    return;
  }

  console.log('👤 Current user:', user.email);
  console.log('   User ID:', user.id);
  console.log('');

  // Check if profile exists, get family_id if it does
  let { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email, family_id')
    .eq('id', user.id)
    .single();

  let familyId = existingProfile?.family_id || null;
  
  console.log('📋 Existing profile:', existingProfile ? 'Found' : 'Not found');
  if (familyId) {
    console.log('👨‍👩‍👧‍👦 Family ID:', familyId);
  } else {
    console.log('⚠️  No family assigned (will proceed without one)');
  }
  console.log('');

  // Create user_profile for points tracking
  const { error: userProfileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      role: 'child',
      total_points: 150
    });

  if (userProfileError) {
    console.error('❌ Error creating user_profile:', userProfileError.message);
  } else {
    console.log('✅ User profile created/updated with 150 points');
  }
  console.log('');

  // Create sample tasks for the child
  const sampleTasks = [
    { title: 'Clean your room', description: 'Make your bed and organize your toys', points: 20, category: 'chores' },
    { title: 'Do homework', description: 'Complete all math assignments', points: 30, category: 'homework' },
    { title: 'Walk the dog', description: 'Take Buddy for a 15-minute walk', points: 15, category: 'pets' },
    { title: 'Brush teeth', description: 'Brush your teeth morning and night', points: 10, category: 'personal' },
    { title: 'Help with dishes', description: 'Load the dishwasher after dinner', points: 15, category: 'chores' },
    { title: 'Read for 20 minutes', description: 'Read a book of your choice', points: 25, category: 'homework' },
  ];

  console.log('📋 Creating sample tasks...');
  
  for (const task of sampleTasks) {
    const taskData = {
      ...task,
      assigned_to: user.id,
      completed: false,
      created_at: new Date().toISOString()
    };
    
    // Only add family_id if we have one
    if (familyId) {
      taskData.family_id = familyId;
    }

    const { error: taskError } = await supabase
      .from('tasks')
      .insert(taskData);

    if (taskError) {
      console.error(`❌ Error creating task "${task.title}":`, taskError.message);
    } else {
      console.log(`✅ Created task: ${task.title} (${task.points} points)`);
    }
  }

  console.log('');

  // Create sample rewards only if we have a family_id
  if (familyId) {
    const sampleRewards = [
      { title: '30 mins extra screen time', description: 'Earn 30 extra minutes on tablet/TV', points_cost: 50 },
      { title: 'Choose dinner menu', description: 'Pick what we have for dinner tonight', points_cost: 75 },
      { title: 'Stay up 30 mins late', description: 'Stay up 30 minutes past bedtime', points_cost: 100 },
      { title: 'Movie night', description: 'Watch a movie of your choice with family', points_cost: 150 },
      { title: 'Ice cream trip', description: 'Go out for ice cream', points_cost: 200 }
    ];

    console.log('🎁 Creating sample rewards...');
    
    for (const reward of sampleRewards) {
      const { error: rewardError } = await supabase
        .from('rewards')
        .insert({
          ...reward,
          family_id: familyId,
          created_by: user.id,
          is_active: true,
          created_at: new Date().toISOString()
        });

      if (rewardError) {
        console.error(`❌ Error creating reward "${reward.title}":`, rewardError.message);
      } else {
        console.log(`✅ Created reward: ${reward.title} (${reward.points_cost} points)`);
      }
    }
  } else {
    console.log('⚠️  Skipping rewards creation (no family_id)');
  }

  console.log('');
  console.log('🎉 Test data restored successfully!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   - Child User: ${user.email}`);
  console.log(`   - Tasks Created: ${sampleTasks.length}`);
  console.log(`   - Rewards Created: ${familyId ? 5 : 0}`);
  console.log(`   - Starting Points: 150`);
  console.log('');
  console.log('🔄 Refresh your browser to see the data!');
}

restoreChildData().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
