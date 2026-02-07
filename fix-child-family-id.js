const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function fixChildFamilyId() {
  console.log('🔧 Fixing Child Family ID\n');
  console.log('=' .repeat(70));

  try {
    const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
    let familyId = null;

    // 1. Check if child has tasks - get family_id from tasks
    console.log('\n📋 Step 1: Finding family_id from child\'s tasks...\n');

    const { data: childTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('family_id')
      .eq('assigned_to', childId)
      .limit(1)
      .single();

    if (tasksError || !childTasks) {
      console.error('❌ Could not find tasks for child');
      console.log('   Let\'s check parent profiles instead...\n');

      // Try to find parent
      const { data: parentProfile, error: parentError } = await supabase
        .from('profiles')
        .select('family_id, id')
        .limit(1);

      const validParent = parentProfile?.find(p => p.family_id);

      if (parentError || !validParent) {
        console.error('❌ Could not find parent with family_id');
        console.log('\n   Manual fix needed:');
        console.log('   1. Log in as parent');
        console.log('   2. Check Settings for the family code');
        console.log('   3. Have child re-register using that family code\n');
        return;
      }

      familyId = validParent.family_id;
      console.log(`✅ Found family_id from parent: ${familyId}\n`);
    } else {
      familyId = childTasks.family_id;
      console.log(`✅ Found family_id from tasks: ${familyId}\n`);
    }

    // 2. Update child's profile with family_id
    console.log('📋 Step 2: Updating child profile with family_id...\n');

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ family_id: familyId })
      .eq('id', childId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
      return;
    }

    console.log('✅ Successfully updated child profile!');
    console.log(`   User ID: ${childId}`);
    console.log(`   Family ID: ${familyId}\n`);

    // 3. Verify the fix
    console.log('📋 Step 3: Verifying the fix...\n');

    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', childId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError.message);
    } else {
      console.log('✅ Child profile verified:');
      console.log(`   User ID: ${verifyProfile.id}`);
      console.log(`   Name: ${verifyProfile.name || 'Not set'}`);
      console.log(`   Family ID: ${verifyProfile.family_id || 'Not set'}\n`);
    }

    // 4. Check what rewards are now available
    console.log('📋 Step 4: Checking available rewards for this family...\n');

    const { data: familyRewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true);

    if (rewardsError) {
      console.error('❌ Error fetching rewards:', rewardsError.message);
    } else if (!familyRewards || familyRewards.length === 0) {
      console.log('⚠️  No rewards found for this family yet.');
      console.log('   Parent should create rewards from parent dashboard.\n');
    } else {
      console.log(`✅ Found ${familyRewards.length} reward(s) available:`);
      familyRewards.forEach((reward, idx) => {
        console.log(`   ${idx + 1}. "${reward.title}" - ${reward.points_cost} points`);
      });
      console.log('');
    }

    console.log('=' .repeat(70));
    console.log('\n🎉 SUCCESS! Child data should now load properly!\n');
    console.log('Next steps:');
    console.log('   1. Refresh the child dashboard page');
    console.log('   2. Tasks should now be visible');
    console.log('   3. Rewards should be available (if parent created any)');
    console.log('   4. Points should display correctly\n');

  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    console.error(error);
  }
}

fixChildFamilyId();
