const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function simpleTest() {
  console.log('\n🔍 Simple Gamification Test\n');
  console.log('='.repeat(80));

  try {
    const childId = '17eb2a70-6fef-4f01-8303-03883c92e705';
    
    // Step 1: Call the function directly (bypass trigger)
    console.log('\n📝 Step 1: Testing process_task_approval_gamification directly...\n');
    
    const { data: directResult, error: directError } = await supabase
      .rpc('process_task_approval_gamification', {
        p_user_id: childId,
        p_task_points: 5
      });

    if (directError) {
      console.error('❌ Direct function call failed:', directError.message);
      console.log('\nThis suggests the function still has issues.');
      console.log('Recommendation: Re-run the entire FIX-GAMIFICATION-SECURITY-DEFINER.sql script');
      return;
    }

    console.log('✅ Direct function call succeeded!');
    console.log('Result:', JSON.stringify(directResult, null, 2));

    // Step 2: Check the data
    console.log('\n📊 Step 2: Checking gamification data...\n');
    
    const { data: levels } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', childId)
      .single();

    const { data: streaks } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', childId)
      .single();

    console.log('Levels:', levels);
    console.log('Streaks:', streaks);

    if (levels && levels.total_xp > 0) {
      console.log('\n🎉 SUCCESS! Gamification functions are working!');
      console.log('XP awarded:', levels.total_xp);
      console.log('Current level:', levels.current_level);
      console.log('Current streak:', streaks?.current_streak || 0);
      
      console.log('\n✅ Next: Test the trigger by approving a real task');
    } else {
      console.log('\n⚠️  Function ran but no XP was awarded');
      console.log('This might be expected if the user already had gamification data');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

simpleTest().catch(console.error);
