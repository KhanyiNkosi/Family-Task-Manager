const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getHelperFunctions() {
  console.log('🔍 Fetching Helper Function Definitions\n');
  console.log('='.repeat(80));

  const functions = [
    { name: 'award_task_xp', emoji: '🎯', desc: 'AWARD XP' },
    { name: 'update_task_streak', emoji: '🔥', desc: 'STREAK' },
    { name: 'check_and_unlock_achievements', emoji: '🏆', desc: 'ACHIEVEMENTS' }
  ];

  for (const func of functions) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`${func.emoji} ${func.desc} FUNCTION: ${func.name}`);
    console.log('='.repeat(80));

    // Use direct SQL query via Supabase
    const query = `
      SELECT pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = $1
    `;

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: query, params: [func.name] });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
        console.log('\n💡 Please run the SQL query manually in Supabase SQL Editor:');
        console.log(`\nSELECT pg_get_functiondef(p.oid)\nFROM pg_proc p\nJOIN pg_namespace n ON n.oid = p.pronamespace\nWHERE n.nspname = 'public' AND p.proname = '${func.name}';\n`);
      } else if (data && data.length > 0) {
        console.log(data[0].definition);
        
        // Check for SECURITY DEFINER
        if (data[0].definition.includes('SECURITY DEFINER')) {
          console.log('\n✅ This function is SECURITY DEFINER');
        } else {
          console.log('\n⚠️  This function is NOT SECURITY DEFINER (may cause RLS issues)');
        }
      } else {
        console.log('❌ Function not found');
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
      console.log('\n💡 Falling back to SQL file - please run get-helper-functions.sql in Supabase SQL Editor');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📋 KEY FINDINGS TO LOOK FOR:');
  console.log('   1. Are functions SECURITY DEFINER or SECURITY INVOKER?');
  console.log('   2. Do they contain error handling (BEGIN...EXCEPTION)?');
  console.log('   3. What tables do they write to?');
  console.log('   4. Are writes potentially blocked by RLS?');
  console.log('='.repeat(80) + '\n');
}

getHelperFunctions().catch(console.error);
