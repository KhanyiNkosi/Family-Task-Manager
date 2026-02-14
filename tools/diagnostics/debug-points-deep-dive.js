import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHILD_ID = '17eb2a70-6fef-4f01-8303-03883c92e705';

async function debugPointsCalculation() {
  console.log('\n🔍 DEEP DIVE: Points Calculation for Child\n');
  console.log('Child ID:', CHILD_ID);
  console.log('='.repeat(60));

  // 1. Check tasks table directly
  console.log('\n1️⃣ TASKS - Approved & Points:');
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, points, approved, completed, created_at')
    .eq('assigned_to', CHILD_ID)
    .order('created_at', { ascending: false });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
  } else {
    const approvedTasks = tasks.filter(t => t.approved);
    const pendingTasks = tasks.filter(t => t.completed && !t.approved);
    
    console.log(`\n   Approved Tasks (${approvedTasks.length}):`);
    approvedTasks.forEach(t => {
      console.log(`   ✅ [${t.points}pts] ${t.title} (${new Date(t.created_at).toLocaleDateString()})`);
    });
    
    const totalEarned = approvedTasks.reduce((sum, t) => sum + (t.points || 0), 0);
    console.log(`\n   💰 Total Earned from Approved Tasks: ${totalEarned} points`);
    
    if (pendingTasks.length > 0) {
      console.log(`\n   ⏳ Pending Tasks (completed but not approved): ${pendingTasks.length}`);
      pendingTasks.forEach(t => {
        console.log(`      [${t.points}pts] ${t.title}`);
      });
    }
  }

  // 2. Check reward redemptions
  console.log('\n\n2️⃣ REWARD REDEMPTIONS:');
  const { data: redemptions, error: redemptionsError } = await supabase
    .from('reward_redemptions')
    .select('id, points_spent, status, created_at')
    .eq('user_id', CHILD_ID)
    .order('created_at', { ascending: false });

  if (redemptionsError) {
    console.error('Error fetching redemptions:', redemptionsError);
  } else {
    console.log(`\n   Total Redemptions: ${redemptions.length}`);
    
    const approvedRedemptions = redemptions.filter(r => r.status === 'approved');
    const pendingRedemptions = redemptions.filter(r => r.status === 'pending');
    const rejectedRedemptions = redemptions.filter(r => r.status === 'rejected');
    
    if (approvedRedemptions.length > 0) {
      console.log(`\n   ✅ Approved (${approvedRedemptions.length}):`);
      approvedRedemptions.forEach(r => {
        console.log(`      -${r.points_spent}pts (${new Date(r.created_at).toLocaleDateString()})`);
      });
    }
    
    if (pendingRedemptions.length > 0) {
      console.log(`\n   ⏳ Pending (${pendingRedemptions.length}):`);
      pendingRedemptions.forEach(r => {
        console.log(`      -${r.points_spent}pts (${new Date(r.created_at).toLocaleDateString()})`);
      });
    }
    
    if (rejectedRedemptions.length > 0) {
      console.log(`\n   ❌ Rejected (${rejectedRedemptions.length}):`);
      rejectedRedemptions.forEach(r => {
        console.log(`      -${r.points_spent}pts (${new Date(r.created_at).toLocaleDateString()})`);
      });
    }
    
    const totalSpent = approvedRedemptions.reduce((sum, r) => sum + (r.points_spent || 0), 0);
    console.log(`\n   💸 Total Spent (Approved Only): ${totalSpent} points`);
  }

  // 3. Calculate final balance
  console.log('\n\n3️⃣ FINAL CALCULATION:');
  const approvedTasks = tasks?.filter(t => t.approved) || [];
  const totalEarned = approvedTasks.reduce((sum, t) => sum + (t.points || 0), 0);
  
  const approvedRedemptions = redemptions?.filter(r => r.status === 'approved') || [];
  const totalSpent = approvedRedemptions.reduce((sum, r) => sum + (r.points_spent || 0), 0);
  
  const balance = totalEarned - totalSpent;
  
  console.log(`   Earned:  ${totalEarned} points`);
  console.log(`   Spent:   ${totalSpent} points`);
  console.log(`   ─────────────────────`);
  console.log(`   Balance: ${balance} points`);

  // 4. Check what the UI loadChildren function would calculate
  console.log('\n\n4️⃣ SIMULATING UI loadChildren() LOGIC:');
  const { data: uiTasks } = await supabase
    .from('tasks')
    .select('points')
    .eq('assigned_to', CHILD_ID)
    .eq('approved', true);
  
  const uiEarned = uiTasks?.reduce((sum, task) => sum + (task.points || 0), 0) || 0;
  
  const { data: uiRedemptions } = await supabase
    .from('reward_redemptions')
    .select('points_spent')
    .eq('user_id', CHILD_ID)
    .eq('status', 'approved');
  
  const uiSpent = uiRedemptions?.reduce((sum, r) => sum + (r.points_spent || 0), 0) || 0;
  const uiBalance = uiEarned - uiSpent;
  
  console.log(`   UI would calculate: ${uiBalance} points`);
  console.log(`   (Earned: ${uiEarned}, Spent: ${uiSpent})`);

  // 5. Check if there's a total_points column in profiles
  console.log('\n\n5️⃣ CHECKING PROFILES TABLE:');
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', CHILD_ID)
    .single();
  
  if (profile) {
    console.log('   Profile columns:', Object.keys(profile));
    if ('total_points' in profile) {
      console.log(`   ⚠️  WARNING: total_points column exists with value: ${profile.total_points}`);
      console.log('   This might be causing conflicts!');
    } else {
      console.log('   ✅ No total_points column (good)');
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic Complete\n');
}

debugPointsCalculation().catch(console.error);
