import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyEnhancements() {
  console.log('🔍 Verifying Enhanced Deployment Files...\n');
  console.log('════════════════════════════════════════════════════════════════');
  
  // Check if files exist
  const fs = await import('fs');
  const files = [
    'fix-parent-notifications-final-idempotent-enhanced.sql',
    'fix-parent-notifications-backfill-enhanced.sql',
    'PARENT-NOTIFICATIONS-ENHANCED-DEPLOY-GUIDE.md'
  ];
  
  console.log('\n📁 File Verification:');
  for (const file of files) {
    const exists = fs.existsSync(join(__dirname, file));
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  }
  
  // Check current database state
  console.log('\n📊 Current Database State:');
  
  // Check metadata column
  const { data: sample } = await supabase.from('notifications').select('*').limit(1);
  const hasMetadata = sample && sample.length > 0 && 'metadata' in sample[0];
  console.log(`  Metadata column: ${hasMetadata ? '✅ EXISTS' : '❌ MISSING'}`);
  
  // Check for existing indexes
  const { data: indexes, error: indexError } = await supabase
    .from('pg_indexes')
    .select('indexname')
    .eq('tablename', 'notifications')
    .like('indexname', '%metadata%');
  
  if (!indexError && indexes) {
    console.log(`  Metadata indexes: ${indexes.length > 0 ? '✅ ' + indexes.length + ' found' : '❌ NONE'}`);
    if (indexes.length > 0) {
      indexes.forEach(idx => console.log(`    - ${idx.indexname}`));
    }
  }
  
  // Count redemptions vs notifications
  const { data: redemptions } = await supabase
    .from('reward_redemptions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['approved', 'rejected']);
  
  const { data: notifs } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .not('metadata->>redemption_id', 'is', null);
  
  console.log(`  Approved/rejected redemptions: ${redemptions || 'Unknown'}`);
  console.log(`  Reward notifications: ${notifs || 'Unknown'}`);
  
  // Check for recent test
  const { data: recent } = await supabase
    .from('notifications')
    .select('id, created_at')
    .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .limit(1);
  
  console.log(`  Recent notifications (5 min): ${recent?.length || 0}`);
  
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('\n📋 Deployment Checklist:');
  console.log('  [ ] Enhanced SQL files created');
  console.log('  [ ] Deployment guide created');
  console.log('  [ ] Reviewed enhancements (indexes, logging, security)');
  console.log('  [ ] Ready to deploy to Supabase Dashboard');
  
  console.log('\n🚀 Next Steps:');
  console.log('  1. Open https://supabase.com/dashboard');
  console.log('  2. Go to SQL Editor');
  console.log('  3. Run: fix-parent-notifications-final-idempotent-enhanced.sql');
  console.log('  4. Run: fix-parent-notifications-backfill-enhanced.sql');
  console.log('  5. Verify with test redemption approval');
  
  console.log('\n📖 Full instructions in: PARENT-NOTIFICATIONS-ENHANCED-DEPLOY-GUIDE.md');
  console.log('\n');
}

verifyEnhancements().catch(console.error);
