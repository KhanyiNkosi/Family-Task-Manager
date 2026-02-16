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

async function diagnose() {
  console.log('🔍 Diagnosing Parent Notifications...\n');

  // Check metadata column
  const { data: sample } = await supabase.from('notifications').select('*').limit(1);
  const hasMetadata = sample && sample.length > 0 && 'metadata' in sample[0];
  console.log('Metadata column:', hasMetadata ? '✅ YES' : '❌ NO');

  // Check redemptions
  const { data: redemptions } = await supabase
    .from('reward_redemptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(`\nRecent redemptions: ${redemptions?.length || 0}`);

  //  Check for notifications
  if (redemptions && redemptions.length > 0) {
    for (const r of redemptions.slice(0, 3)) {
      const { data: notifs } = await supabase
        .from('notifications')
        .select('id, user_id')
        .or(`title.ilike.%${r.id}%,metadata->>redemption_id.eq.${r.id}`);
      
      let parentCount = 0;
      if (notifs) {
        for (const n of notifs) {
          const { data: up } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', n.user_id)
            .single();
          if (up?.role === 'parent') parentCount++;
        }
      }
      
      console.log(`  Redemption ${r.status}: ${notifs?.length || 0} notifs, ${parentCount} parent notifs`);
      if ((r.status === 'approved' || r.status === 'rejected') && parentCount === 0) {
        console.log(`    ⚠️  MISSING PARENT NOTIFICATION!`);
      }
    }
  }

  // Check parents
  const { data: parents } = await supabase.from('user_profiles').select('id').eq('role', 'parent');
  console.log(`\nParents in system: ${parents?.length || 0}`);
  
  console.log('\n📝 Next steps:');
  console.log('  1. Go to https://supabase.com/dashboard');
  console.log('  2. Select your project');
  console.log('  3. Go to SQL Editor');
  console.log('  4. Run: fix-parent-notifications-final-idempotent.sql');
  console.log('  5. Run: fix-parent-notifications-backfill.sql');
}

diagnose().catch(console.error);
