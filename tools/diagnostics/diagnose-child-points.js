const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnoseFamilyMemberPoints() {
  console.log('🔍 Diagnosing Family Member Points\n');
  console.log('='.repeat(80));

  try {
    const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
    
    // 1. Get approved tasks and their points
    console.log('\n📝 STEP 1: Checking approved tasks...\n');
    
    const { data: approvedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, points, approved, completed, created_at')
      .eq('assigned_to', childId)
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return;
    }

    console.log(`Found ${approvedTasks?.length || 0} approved tasks:`);
    let earnedPoints = 0;
    approvedTasks?.forEach(task => {
      console.log(`  - ${task.title}: ${task.points} points (${task.created_at})`);
      earnedPoints += task.points || 0;
    });
    console.log(`\n  TOTAL EARNED: ${earnedPoints} points`);

    // 2. Get approved reward redemptions
    console.log('\n\n💰 STEP 2: Checking approved reward redemptions...\n');
    
    const { data: redemptions, error: redemptionsError } = await supabase
      .from('reward_redemptions')
      .select('id, points_spent, status, redeemed_at, reward:rewards(title)')
      .eq('user_id', childId)
      .eq('status', 'approved')
      .order('redeemed_at', { ascending: false });

    if (redemptionsError) {
      console.error('Error fetching redemptions:', redemptionsError);
      return;
    }

    console.log(`Found ${redemptions?.length || 0} approved redemptions:`);
    let spentPoints = 0;
    redemptions?.forEach(redemption => {
      console.log(`  - ${redemption.reward?.title || 'Unknown'}: ${redemption.points_spent} points (${redemption.redeemed_at})`);
      spentPoints += redemption.points_spent || 0;
    });
    console.log(`\n  TOTAL SPENT: ${spentPoints} points`);

    // 3. Calculate current balance
    const currentBalance = earnedPoints - spentPoints;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 POINTS CALCULATION:\n');
    console.log(`  Earned from approved tasks:  ${earnedPoints} points`);
    console.log(`  Spent on approved redemptions: -${spentPoints} points`);
    console.log(`  ─────────────────────────────────────`);
    console.log(`  CURRENT BALANCE:             ${currentBalance} points`);
    console.log('='.repeat(80));

    console.log('\n🔍 COMPARISON:\n');
    console.log(`  Dashboard shows:    71 points  ${currentBalance === 71 ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log(`  Calculated balance: ${currentBalance} points`);
    
    if (currentBalance !== 71) {
      console.log(`\n⚠️  DISCREPANCY FOUND: ${Math.abs(71 - currentBalance)} points difference`);
      
      if (currentBalance > 71) {
        console.log(`\n💡 Possible causes:`);
        console.log(`   - Some approved tasks may not be counted`);
        console.log(`   - Dashboard query might have different filters`);
        console.log(`   - Caching issue in the UI`);
      } else {
        console.log(`\n💡 Possible causes:`);
        console.log(`   - Some redemptions not properly marked as approved`);
        console.log(`   - Pending redemptions being counted as spent`);
        console.log(`   - Extra points being added somewhere`);
      }
    } else {
      console.log(`\n✅ Points calculation is CORRECT!`);
      console.log(`   The dashboard is showing the accurate balance.`);
    }

    // 4. Check pending redemptions
    console.log('\n' + '='.repeat(80));
    console.log('📋 PENDING REDEMPTIONS:\n');
    
    const { data: pendingRedemptions } = await supabase
      .from('reward_redemptions')
      .select('id, points_spent, status, redeemed_at, reward:rewards(title)')
      .eq('user_id', childId)
      .eq('status', 'pending');

    if (pendingRedemptions && pendingRedemptions.length > 0) {
      console.log(`Found ${pendingRedemptions.length} pending redemptions:`);
      let pendingPoints = 0;
      pendingRedemptions.forEach(redemption => {
        console.log(`  - ${redemption.reward?.title || 'Unknown'}: ${redemption.points_spent} points`);
        pendingPoints += redemption.points_spent || 0;
      });
      console.log(`\n  TOTAL PENDING: ${pendingPoints} points (not deducted yet)`);
    } else {
      console.log('No pending redemptions');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

diagnoseFamilyMemberPoints().catch(console.error);
