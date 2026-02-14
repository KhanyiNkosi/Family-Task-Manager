const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnoseIssues() {
  console.log('🔍 Diagnosing Activity Feed & Points Issues\n');
  console.log('='.repeat(80));

  const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
  const familyId = '32af85db-12f6-4d60-9995-f585aa973ba3';

  // ========================================================================
  // ISSUE 1: Activity Feed
  // ========================================================================
  console.log('\n📰 ISSUE 1: Activity Feed\n');

  const { data: activities, error: activitiesError } = await supabase
    .from('activity_feed')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (activitiesError) {
    console.error('❌ Error loading activities:', activitiesError.message);
  } else {
    console.log(`Found ${activities?.length || 0} activities:`);
    activities?.forEach((act, i) => {
      console.log(`  ${i + 1}. ${act.activity_type}: ${act.title} (${new Date(act.created_at).toLocaleString()})`);
    });
  }

  // Check if activity_feed_with_stats view exists
  console.log('\n📊 Checking activity_feed_with_stats view...');
  const { data: statsActivities, error: statsError } = await supabase
    .from('activity_feed_with_stats')
    .select('*')
    .eq('family_id', familyId)
    .limit(5);

  if (statsError) {
    console.error('❌ View error:', statsError.message);
    console.log('💡 The view might not exist or needs to be recreated');
  } else {
    console.log(`✅ View works - found ${statsActivities?.length || 0} activities with stats`);
  }

  // ========================================================================
  // ISSUE 2: Points Calculation
  // ========================================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('💰 ISSUE 2: Points Calculation\n');

  // Direct database query
  const { data: approvedTasks } = await supabase
    .from('tasks')
    .select('id, title, points, approved, completed, created_at')
    .eq('assigned_to', childId)
    .eq('approved', true);

  const earnedPoints = approvedTasks?.reduce((sum, task) => sum + (task.points || 0), 0) || 0;

  const { data: approvedRedemptions } = await supabase
    .from('reward_redemptions')
    .select('id, points_spent, status')
    .eq('user_id', childId)
    .eq('status', 'approved');

  const spentPoints = approvedRedemptions?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;
  const calculatedBalance = earnedPoints - spentPoints;

  console.log('Direct Database Query:');
  console.log(`  Earned: ${earnedPoints} points`);
  console.log(`  Spent: ${spentPoints} points`);
  console.log(`  Balance: ${calculatedBalance} points`);

  // Check what the UI is seeing
  console.log('\n🖥️  UI Query Simulation (matching parent dashboard)...');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', childId)
    .single();

  const { data: familyProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('family_id', profile.family_id);

  console.log(`\nFamily members found: ${familyProfiles?.length || 0}`);
  
  for (const member of familyProfiles || []) {
    if (member.role === 'child') {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('points')
        .eq('assigned_to', member.id)
        .eq('approved', true);
      
      const earned = tasks?.reduce((sum, t) => sum + (t.points || 0), 0) || 0;
      
      const { data: redemptions } = await supabase
        .from('reward_redemptions')
        .select('points_spent')
        .eq('user_id', member.id)
        .eq('status', 'approved');
      
      const spent = redemptions?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;
      
      console.log(`  ${member.full_name}: ${earned} - ${spent} = ${earned - spent} points`);
    }
  }

  // ========================================================================
  // ISSUE 3: Check for cached/stale data
  // ========================================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('🗄️  Checking for data consistency...\n');

  // Check if there's a total_points column in profiles (shouldn't be used)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', childId)
    .single();

  console.log('Profile columns:', Object.keys(profileData || {}));
  if (profileData && 'total_points' in profileData) {
    console.log(`⚠️  WARNING: profiles.total_points exists = ${profileData.total_points}`);
    console.log('   This might be causing the discrepancy!');
  }

  // ========================================================================
  // RECOMMENDATIONS
  // ========================================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS:\n');

  if (activities && activities.length === 0) {
    console.log('Activity Feed Issues:');
    console.log('  ❌ No activities found - triggers may not be working');
    console.log('  🔧 Check: activity_feed triggers on tasks table');
    console.log('  🔧 Check: activity_feed_with_stats view exists');
  }

  if (calculatedBalance !== 71) {
    console.log('\nPoints Calculation Issues:');
    console.log(`  ❌ Expected: ${calculatedBalance} points`);
    console.log('  ❌ Dashboard shows: 71 points');
    console.log('  🔧 Possible causes:');
    console.log('     - Browser cache');
    console.log('     - Stale profiles.total_points column');
    console.log('     - loadChildren() not being called');
  }

  console.log('\n' + '='.repeat(80));
}

diagnoseIssues().catch(console.error);
