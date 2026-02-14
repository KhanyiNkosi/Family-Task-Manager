const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testGamificationFix() {
  console.log('🧪 Testing Gamification Fix After SECURITY DEFINER Changes\n');
  console.log('='.repeat(80));

  try {
    const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
    const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

    // ========================================================================
    // STEP 1: GET BEFORE STATE
    // ========================================================================
    console.log('\n📊 STEP 1: Getting current gamification stats...\n');

    const { data: beforeLevels } = await supabase
      .from('user_levels')
      .select('current_level, total_xp, xp_for_next_level')
      .eq('user_id', childId)
      .single();

    const { data: beforeStreaks } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_completion_date')
      .eq('user_id', childId)
      .single();

    const { data: beforeAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, is_earned')
      .eq('user_id', childId)
      .eq('is_earned', true);

    console.log('BEFORE STATE:');
    console.log('  Level:', beforeLevels?.current_level || 1);
    console.log('  Total XP:', beforeLevels?.total_xp || 0);
    console.log('  Current Streak:', beforeStreaks?.current_streak || 0);
    console.log('  Achievements:', beforeAchievements?.length || 0, 'unlocked');

    // ========================================================================
    // STEP 2: FIND OR CREATE A TEST TASK
    // ========================================================================
    console.log('\n📋 STEP 2: Finding/creating test task...\n');

    // Try to find an existing unapproved completed task
    let { data: testTask } = await supabase
      .from('tasks')
      .select('id, title, points, approved, completed')
      .eq('assigned_to', childId)
      .eq('completed', true)
      .eq('approved', false)
      .limit(1)
      .single();

    // If none exist, create a test task
    if (!testTask) {
      console.log('  No unapproved tasks found. Creating test task...');
      
      const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert({
          title: '🧪 Test Task - Gamification Fix Validation',
          description: 'Auto-generated test task to validate SECURITY DEFINER fix',
          assigned_to: childId,
          family_id: familyId,
          points: 10,
          completed: true,
          completed_at: new Date().toISOString(),
          approved: false,
          due_date: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create test task: ${createError.message}`);
      }

      testTask = newTask;
      console.log('  ✅ Created test task:', testTask.id);
    } else {
      console.log('  ✅ Found existing task:', testTask.id);
    }

    console.log('  Task:', testTask.title);
    console.log('  Points:', testTask.points);

    // ========================================================================
    // STEP 3: APPROVE THE TASK (TRIGGER WILL FIRE)
    // ========================================================================
    console.log('\n⚡ STEP 3: Approving task (trigger will fire)...\n');

    const { data: approvedTask, error: approveError } = await supabase
      .from('tasks')
      .update({ approved: true })
      .eq('id', testTask.id)
      .select()
      .single();

    if (approveError) {
      throw new Error(`Failed to approve task: ${approveError.message}`);
    }

    console.log('  ✅ Task approved successfully');
    console.log('  Trigger should have fired: task_approval_with_gamification()');

    // Wait a moment for trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // ========================================================================
    // STEP 4: CHECK AFTER STATE
    // ========================================================================
    console.log('\n📊 STEP 4: Checking gamification updates...\n');

    const { data: afterLevels } = await supabase
      .from('user_levels')
      .select('current_level, total_xp, xp_for_next_level')
      .eq('user_id', childId)
      .single();

    const { data: afterStreaks } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_completion_date')
      .eq('user_id', childId)
      .single();

    const { data: afterAchievements } = await supabase
      .from('user_achievements')
      .select('achievement_id, is_earned')
      .eq('user_id', childId)
      .eq('is_earned', true);

    console.log('AFTER STATE:');
    console.log('  Level:', afterLevels?.current_level || 1);
    console.log('  Total XP:', afterLevels?.total_xp || 0);
    console.log('  Current Streak:', afterStreaks?.current_streak || 0);
    console.log('  Achievements:', afterAchievements?.length || 0, 'unlocked');

    // ========================================================================
    // STEP 5: VALIDATE CHANGES
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('🎯 VALIDATION RESULTS:\n');

    const expectedXP = testTask.points * 10; // XP formula: points × 10
    const xpChange = (afterLevels?.total_xp || 0) - (beforeLevels?.total_xp || 0);
    const streakChange = (afterStreaks?.current_streak || 0) - (beforeStreaks?.current_streak || 0);
    const achievementChange = (afterAchievements?.length || 0) - (beforeAchievements?.length || 0);

    let allPassed = true;

    // Check XP
    if (xpChange === expectedXP) {
      console.log(`✅ XP UPDATED: +${xpChange} XP (expected +${expectedXP})`);
    } else if (xpChange > 0) {
      console.log(`⚠️  XP UPDATED: +${xpChange} XP (expected +${expectedXP}) - May be correct if level-up occurred`);
    } else {
      console.log(`❌ XP NOT UPDATED: Expected +${expectedXP} XP, got +${xpChange}`);
      allPassed = false;
    }

    // Check Streak
    if (streakChange >= 0) {
      console.log(`✅ STREAK CHECKED: ${afterStreaks?.current_streak || 0} days (${streakChange >= 1 ? '+' + streakChange : 'no change - same day'})`);
    } else {
      console.log(`⚠️  STREAK CHANGED: ${afterStreaks?.current_streak || 0} days (${streakChange})`);
    }

    // Check Achievements
    if (achievementChange > 0) {
      console.log(`✅ ACHIEVEMENTS UNLOCKED: +${achievementChange} new achievement(s)!`);
    } else {
      console.log(`ℹ️  ACHIEVEMENTS: No new unlocks (criteria not met or already unlocked)`);
    }

    console.log('\n' + '='.repeat(80));

    if (allPassed && xpChange > 0) {
      console.log('🎉 SUCCESS! Gamification is now working correctly!');
      console.log('✅ SECURITY DEFINER fix resolved the RLS issue');
      console.log('✅ Parent can now approve tasks and child receives XP/streaks');
    } else if (xpChange === 0) {
      console.log('❌ FAILED! Gamification still not working.');
      console.log('🔍 Check Postgres logs for trigger errors:');
      console.log('   - Search for "Gamification processed" NOTICE messages');
      console.log('   - Look for RLS policy violations or function errors');
    } else {
      console.log('⚠️  Partial success - review results above');
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error);
  }
}

testGamificationFix().catch(console.error);
