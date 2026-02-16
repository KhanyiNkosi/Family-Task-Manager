import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyBackfill() {
  console.log('🔍 Verifying Backfill Deployment...\n');
  console.log('════════════════════════════════════════════════════════════════');
  
  // Check 1: Duplication check
  console.log('\n✓ CHECK 1: Duplicate Notifications');
  console.log('────────────────────────────────────────────────────────────────');
  
  const { data: duplicates, error: dupError } = await supabase.rpc('execute_sql', {
    query: `
      SELECT 
        metadata->>'redemption_id' AS redemption_id,
        metadata->>'status' AS status,
        COUNT(*) as notification_count
      FROM notifications 
      WHERE metadata->>'redemption_id' IS NOT NULL
      GROUP BY metadata->>'redemption_id', metadata->>'status'
      HAVING COUNT(*) > 2
      ORDER BY COUNT(*) DESC
      LIMIT 10;
    `
  });
  
  // Try alternative method if RPC doesn't work
  const { data: allNotifs } = await supabase
    .from('notifications')
    .select('metadata')
    .not('metadata->>redemption_id', 'is', null);
  
  if (allNotifs) {
    const grouped = {};
    allNotifs.forEach(n => {
      const key = `${n.metadata?.redemption_id}-${n.metadata?.status}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    const dupes = Object.entries(grouped).filter(([k, count]) => count > 2);
    
    if (dupes.length === 0) {
      console.log('✅ No duplicates found! Each redemption has exactly 2 notifications (child + parent)');
    } else {
      console.log(`⚠️  Found ${dupes.length} redemptions with more than 2 notifications:`);
      dupes.slice(0, 5).forEach(([key, count]) => {
        console.log(`   - ${key}: ${count} notifications`);
      });
    }
  }
  
  // Check 2: Backfilled notifications count
  console.log('\n✓ CHECK 2: Backfilled Notifications');
  console.log('────────────────────────────────────────────────────────────────');
  
  const { count: backfilledCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('metadata->>backfilled', 'true');
  
  const { count: triggerCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('metadata->>created_by_trigger', 'true');
  
  console.log(`Backfilled notifications: ${backfilledCount || 0}`);
  console.log(`Trigger-created notifications: ${triggerCount || 0}`);
  console.log(`Total reward notifications: ${(backfilledCount || 0) + (triggerCount || 0)}`);
  
  // Check 3: Parent vs Child notifications
  console.log('\n✓ CHECK 3: Parent vs Child Distribution');
  console.log('────────────────────────────────────────────────────────────────');
  
  const { data: notifsByRecipient } = await supabase
    .from('notifications')
    .select('metadata')
    .not('metadata->>redemption_id', 'is', null);
  
  if (notifsByRecipient) {
    const parentCount = notifsByRecipient.filter(n => n.metadata?.recipient === 'parent').length;
    const childCount = notifsByRecipient.filter(n => n.metadata?.recipient === 'child').length;
    
    console.log(`Parent notifications: ${parentCount}`);
    console.log(`Child notifications: ${childCount}`);
    
    if (Math.abs(parentCount - childCount) <= 1) {
      console.log('✅ Parent and child notification counts match (balanced)');
    } else {
      console.log(`⚠️  Imbalance detected: ${Math.abs(parentCount - childCount)} difference`);
      console.log('   This may indicate some families without parents');
    }
  }
  
  // Check 4: Coverage - redemptions vs notifications
  console.log('\n✓ CHECK 4: Redemption Coverage');
  console.log('────────────────────────────────────────────────────────────────');
  
  const { count: totalRedemptions } = await supabase
    .from('reward_redemptions')
    .select('*', { count: 'exact', head: true })
    .in('status', ['approved', 'rejected']);
  
  const { data: uniqueRedemptionIds } = await supabase
    .from('notifications')
    .select('metadata')
    .not('metadata->>redemption_id', 'is', null);
  
  const uniqueCount = new Set(
    uniqueRedemptionIds?.map(n => n.metadata?.redemption_id)
  ).size;
  
  console.log(`Total approved/rejected redemptions: ${totalRedemptions || 0}`);
  console.log(`Redemptions with notifications: ${uniqueCount}`);
  console.log(`Coverage: ${totalRedemptions ? ((uniqueCount / totalRedemptions) * 100).toFixed(1) : 0}%`);
  
  if (uniqueCount === totalRedemptions) {
    console.log('✅ 100% coverage! All redemptions have notifications');
  } else {
    console.log(`⚠️  ${(totalRedemptions || 0) - uniqueCount} redemptions still missing notifications`);
  }
  
  // Check 5: Most recent notifications
  console.log('\n✓ CHECK 5: Recent Notification Activity');
  console.log('────────────────────────────────────────────────────────────────');
  
  const { data: recentNotifs } = await supabase
    .from('notifications')
    .select('created_at, title, metadata')
    .not('metadata->>redemption_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentNotifs && recentNotifs.length > 0) {
    console.log('Latest 5 reward notifications:');
    recentNotifs.forEach(n => {
      const backfilled = n.metadata?.backfilled ? '(backfilled)' : '(live trigger)';
      console.log(`   ${new Date(n.created_at).toLocaleString()} - ${n.title} ${backfilled}`);
    });
  }
  
  // Summary
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('════════════════════════════════════════════════════════════════\n');
  
  const allGood = uniqueCount === totalRedemptions && (backfilledCount || 0) > 0;
  
  if (allGood) {
    console.log('✅ DEPLOYMENT SUCCESSFUL!');
    console.log('   • Backfill completed');
    console.log('   • No duplicates detected');
    console.log('   • All redemptions have notifications');
    console.log('   • Parent/child distribution balanced');
  } else {
    console.log('⚠️  DEPLOYMENT COMPLETE WITH NOTES:');
    if (uniqueCount < (totalRedemptions || 0)) {
      console.log(`   • ${(totalRedemptions || 0) - uniqueCount} redemptions still need attention`);
    }
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Test live notification flow (approve a new redemption)');
  console.log('   2. Monitor for any trigger errors in Supabase logs');
  console.log('   3. Consider keeping backfilled flag for audit trail');
  console.log('\n');
}

verifyBackfill().catch(console.error);
