import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CHILD_ID = '17eb2a70-6fef-4f01-8303-03883c92e705';

async function debugFamilyIdMismatch() {
  console.log('\n🔍 Debugging Family ID Foreign Key Violation\n');
  console.log('='.repeat(60));

  // 1. Get child's profile with family_id
  console.log('\n1️⃣ CHILD PROFILE:');
  const { data: childProfile } = await supabase
    .from('profiles')
    .select('id, full_name, family_id, role')
    .eq('id', CHILD_ID)
    .single();

  if (childProfile) {
    console.log('   Child:', childProfile.full_name);
    console.log('   Family ID (UUID):', childProfile.family_id);
    console.log('   Family ID (as text):', String(childProfile.family_id));
  }

  // 2. Check if this family exists in families table
  console.log('\n2️⃣ FAMILIES TABLE:');
  const { data: families, error: familiesError } = await supabase
    .from('families')
    .select('*');

  if (familiesError) {
    console.error('   Error querying families:', familiesError);
  } else {
    console.log(`   Total families: ${families?.length || 0}`);
    if (families && families.length > 0) {
      families.forEach(f => {
        console.log(`   - ID: ${f.id} (${typeof f.id}), Name: ${f.name || 'N/A'}`);
      });
    }
  }

  // 3. Check if child's family_id exists in families table
  if (childProfile && childProfile.family_id) {
    console.log('\n3️⃣ CHECKING MATCH:');
    const familyIdAsText = String(childProfile.family_id);
    
    const { data: matchingFamily } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyIdAsText)
      .single();

    if (matchingFamily) {
      console.log('   ✅ Family exists:', matchingFamily.name || matchingFamily.id);
    } else {
      console.log('   ❌ NO MATCHING FAMILY FOUND!');
      console.log('   Child family_id:', familyIdAsText);
      console.log('   Available family IDs:', families?.map(f => f.id).join(', '));
      console.log('\n   🔧 SOLUTION: Need to create family or update child\'s family_id');
    }
  }

  // 4. Check parent's family_id
  console.log('\n4️⃣ CHECKING PARENT:');
  const { data: parentProfile } = await supabase
    .from('profiles')
    .select('id, full_name, family_id, role')
    .eq('role', 'parent')
    .limit(1)
    .single();

  if (parentProfile) {
    console.log('   Parent:', parentProfile.full_name);
    console.log('   Family ID:', parentProfile.family_id);
    
    const parentFamilyAsText = String(parentProfile.family_id);
    const { data: parentFamily } = await supabase
      .from('families')
      .select('*')
      .eq('id', parentFamilyAsText)
      .single();
    
    if (parentFamily) {
      console.log('   ✅ Parent family exists:', parentFamily.name || parentFamily.id);
    } else {
      console.log('   ❌ Parent family also missing!');
    }
  }

  // 5. Recommendation
  console.log('\n5️⃣ RECOMMENDATION:');
  if (childProfile && families && families.length > 0) {
    const childFamilyId = String(childProfile.family_id);
    const familyExists = families.some(f => f.id === childFamilyId);
    
    if (!familyExists) {
      console.log('   Option A: Create the missing family:');
      console.log(`      INSERT INTO families (id, name) VALUES ('${childFamilyId}', 'Default Family');`);
      console.log('\n   Option B: Update child to use existing family:');
      if (families.length > 0) {
        console.log(`      UPDATE profiles SET family_id = '${families[0].id}'::uuid WHERE id = '${CHILD_ID}';`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic Complete\n');
}

debugFamilyIdMismatch().catch(console.error);
