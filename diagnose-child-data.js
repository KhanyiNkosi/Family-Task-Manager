const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnoseChildData() {
  console.log('🔍 Diagnosing Child Data Issues\n');
  console.log('=' .repeat(70));

  try {
    // 1. Check for child users
    console.log('\n📋 Step 1: Checking for child users...\n');
    
    const { data: allUsers, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, raw_user_meta_data')
      .limit(50);

    if (usersError) {
      console.log('⚠️  Cannot query auth.users directly, trying alternative method...\n');
    }

    // Check user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'child');

    if (profilesError) {
      console.error('❌ Error fetching child profiles:', profilesError.message);
      console.log('   This might be an RLS policy issue.\n');
    } else if (!profiles || profiles.length === 0) {
      console.log('⚠️  No child profiles found in user_profiles table.');
      console.log('   Issue: No child users exist or profiles not created.\n');
      console.log('   Solution:');
      console.log('   1. Register a child account through the app');
      console.log('   2. Or run: check-child-data.js to verify existing data\n');
    } else {
      console.log(`✅ Found ${profiles.length} child profile(s):\n`);
      profiles.forEach((profile, idx) => {
        console.log(`   ${idx + 1}. User ID: ${profile.id}`);
        console.log(`      Role: ${profile.role}`);
        console.log(`      Points: ${profile.total_points || 0}`);
        console.log(`      Family ID: ${profile.family_id || 'Not set'}\n`);
      });

      // 2. Check tasks for each child
      console.log('📋 Step 2: Checking tasks assigned to children...\n');

      for (const profile of profiles) {
        const { data: childTasks, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('assigned_to', profile.id);

        if (tasksError) {
          console.error(`❌ Error fetching tasks for child ${profile.id}:`, tasksError.message);
        } else if (!childTasks || childTasks.length === 0) {
          console.log(`⚠️  No tasks found for child (ID: ${profile.id})`);
          console.log(`   Issue: No tasks assigned to this child.`);
          console.log(`   Solution: Parent should create and assign tasks from parent dashboard.\n`);
        } else {
          console.log(`✅ Found ${childTasks.length} task(s) for child (ID: ${profile.id}):`);
          childTasks.forEach((task, idx) => {
            console.log(`     ${idx + 1}. "${task.title}" - ${task.points} points - Status: ${task.status || 'pending'}`);
          });
          console.log('');
        }
      }

      // 3. Check rewards in family
      console.log('📋 Step 3: Checking available rewards...\n');

      const familyIds = [...new Set(profiles.map(p => p.family_id).filter(Boolean))];
      
      if (familyIds.length === 0) {
        console.log('⚠️  No family_id found for child profiles.');
        console.log('   Issue: Children are not linked to a family.');
        console.log('   Solution: Ensure children joined using a family code.\n');
      } else {
        for (const familyId of familyIds) {
          const { data: familyRewards, error: rewardsError } = await supabase
            .from('rewards')
            .select('*')
            .eq('family_id', familyId)
            .eq('is_active', true);

          if (rewardsError) {
            console.error(`❌ Error fetching rewards for family ${familyId}:`, rewardsError.message);
          } else if (!familyRewards || familyRewards.length === 0) {
            console.log(`⚠️  No active rewards found for family: ${familyId}`);
            console.log(`   Solution: Parent should create rewards from parent dashboard.\n`);
          } else {
            console.log(`✅ Found ${familyRewards.length} reward(s) for family ${familyId}:`);
            familyRewards.forEach((reward, idx) => {
              console.log(`     ${idx + 1}. "${reward.title}" - ${reward.points_cost} points`);
            });
            console.log('');
          }
        }
      }

      // 4. Check RLS policies
      console.log('📋 Step 4: Checking RLS policies...\n');

      const tables = ['tasks', 'user_profiles', 'rewards', 'reward_redemptions'];
      
      for (const table of tables) {
        const { data: policies, error: policiesError } = await supabase
          .rpc('get_policies', { table_name: table })
          .catch(() => null);

        if (!policies) {
          // Try direct query
          const { data: directPolicies } = await supabase
            .from('pg_policies')
            .select('policyname, cmd')
            .eq('tablename', table)
            .catch(() => ({ data: null }));

          if (directPolicies && directPolicies.length > 0) {
            console.log(`✅ Table "${table}" has ${directPolicies.length} RLS policies`);
          } else {
            console.log(`⚠️  Could not verify RLS policies for "${table}"`);
          }
        }
      }

      console.log('');
    }

    // 5. Summary and recommendations
    console.log('=' .repeat(70));
    console.log('\n📊 DIAGNOSIS SUMMARY\n');

    if (!profiles || profiles.length === 0) {
      console.log('🔴 ISSUE: No child users found');
      console.log('   → Create a child account through the registration page\n');
    } else {
      let hasIssues = false;
      
      for (const profile of profiles) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('assigned_to', profile.id);

        if (!tasks || tasks.length === 0) {
          hasIssues = true;
          console.log(`🟡 WARNING: Child ${profile.id} has no tasks assigned`);
          console.log(`   → Parent should create tasks from parent dashboard\n`);
        }
      }

      const hasFamily = profiles.some(p => p.family_id);
      if (!hasFamily) {
        hasIssues = true;
        console.log('🟡 WARNING: Children not linked to any family');
        console.log('   → Children should register using a family code\n');
      }

      if (!hasIssues) {
        console.log('✅ All checks passed! Child data should load properly.');
        console.log('   If the dashboard still shows "no data", check:');
        console.log('   1. Browser console for JavaScript errors');
        console.log('   2. User is logged in as a child (not parent)');
        console.log('   3. Network tab for API request failures\n');
      }
    }

    console.log('🔧 Next Steps:');
    console.log('   1. Ensure parent and child accounts exist');
    console.log('   2. Parent creates tasks and assigns to children');
    console.log('   3. Parent creates rewards for the family');
    console.log('   4. Check browser console when loading child dashboard\n');

  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error.message);
    console.error(error);
  }
}

diagnoseChildData();
