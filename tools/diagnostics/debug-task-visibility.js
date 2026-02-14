import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHILD_ID = '17eb2a70-6fef-4f01-8303-03883c92e705';

async function debugTaskVisibility() {
  console.log('\n🔍 Debugging Task Visibility & Points Mismatch\n');
  console.log('='.repeat(60));

  // 1. Direct query with service role (bypasses RLS)
  console.log('\n1️⃣ DATABASE (Service Role - bypasses RLS):');
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', CHILD_ID)
    .eq('approved', true);

  console.log(`   Total approved tasks: ${allTasks?.length || 0}`);
  let totalPoints = 0;
  if (allTasks && allTasks.length > 0) {
    allTasks.forEach((t, idx) => {
      console.log(`   ${idx + 1}. [${t.points}pts] ${t.title} - approved: ${t.approved}, completed: ${t.completed}`);
      totalPoints += t.points || 0;
    });
    console.log(`   💰 Total: ${totalPoints} points`);
  }

  // 2. Check if tasks have family_id
  console.log('\n2️⃣ TASK FAMILY_ID CHECK:');
  const { data: tasksWithFamily } = await supabase
    .from('tasks')
    .select('id, title, points, family_id')
    .eq('assigned_to', CHILD_ID)
    .eq('approved', true);

  if (tasksWithFamily && tasksWithFamily.length > 0) {
    const withFamily = tasksWithFamily.filter(t => t.family_id !== null);
    const withoutFamily = tasksWithFamily.filter(t => t.family_id === null);
    
    console.log(`   ✅ Tasks WITH family_id: ${withFamily.length}`);
    if (withFamily.length > 0) {
      withFamily.forEach(t => console.log(`      - ${t.title} (${t.points}pts) - family: ${t.family_id}`));
    }
    
    console.log(`   ❌ Tasks WITHOUT family_id: ${withoutFamily.length}`);
    if (withoutFamily.length > 0) {
      withoutFamily.forEach(t => console.log(`      - ${t.title} (${t.points}pts)`));
    }
  }

  // 3. Check child's family_id
  console.log('\n3️⃣ CHILD PROFILE:');
  const { data: childProfile } = await supabase
    .from('profiles')
    .select('id, full_name, family_id')
    .eq('id', CHILD_ID)
    .single();

  if (childProfile) {
    console.log(`   Child: ${childProfile.full_name}`);
    console.log(`   Family ID: ${childProfile.family_id}`);
  }

  // 4. Check if families table has the record now
  console.log('\n4️⃣ FAMILIES TABLE:');
  const { data: families } = await supabase
    .from('families')
    .select('*');

  console.log(`   Total families: ${families?.length || 0}`);
  if (families && families.length > 0) {
    families.forEach(f => console.log(`   - ${f.name} (${f.id})`));
  }

  // 5. RLS Policy simulation
  console.log('\n5️⃣ DIAGNOSIS:');
  const pointsFrom22 = allTasks?.filter(t => t.family_id !== null).reduce((sum, t) => sum + (t.points || 0), 0) || 0;
  const pointsFrom300 = allTasks?.filter(t => t.family_id === null).reduce((sum, t) => sum + (t.points || 0), 0) || 0;
  
  console.log(`   Points from tasks WITH family_id: ${pointsFrom22}`);
  console.log(`   Points from tasks WITHOUT family_id: ${pointsFrom300}`);
  console.log(`   Total in database: ${pointsFrom22 + pointsFrom300}`);
  
  if (pointsFrom300 > 0) {
    console.log('\n   ⚠️  FOUND THE ISSUE!');
    console.log('   Some tasks are missing family_id, so RLS policies block them.');
    console.log('   Tasks without family_id are invisible to child dashboard.');
    console.log('\n   🔧 SOLUTION: Update tasks to set family_id');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic Complete\n');
}

debugTaskVisibility().catch(console.error);
