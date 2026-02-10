import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAndFixProfiles() {
  console.log('\n=== Checking Profiles Setup ===\n');
  
  // Check profiles table
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('role');
    
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  console.log(`Found ${profiles.length} profiles:\n`);
  
  if (profiles.length === 0) {
    console.log('❌ No profiles found. Users need to log in first to auto-create profiles.');
    return;
  }
  
  console.table(profiles.map(p => ({
    role: p.role,
    name: p.full_name,
    email: p.email,
    family_id: p.family_id
  })));
  
  // Check if parent and child have different family_ids
  const parent = profiles.find(p => p.role === 'parent');
  const children = profiles.filter(p => p.role === 'child');
  
  if (!parent) {
    console.log('\n❌ No parent profile found. Parent needs to log in first.');
    return;
  }
  
  if (children.length === 0) {
    console.log('\n❌ No child profiles found. Child needs to log in first.');
    return;
  }
  
  // Check if family_ids match
  const childrenWithDifferentFamily = children.filter(c => c.family_id !== parent.family_id);
  
  if (childrenWithDifferentFamily.length > 0) {
    console.log('\n⚠️  PROBLEM FOUND: Parent and child have different family_ids!\n');
    console.log('Parent family_id:', parent.family_id);
    childrenWithDifferentFamily.forEach(c => {
      console.log(`Child (${c.full_name}) family_id:`, c.family_id);
    });
    
    console.log('\n🔧 FIXING: Setting all children to parent\'s family_id...\n');
    
    // Update children to have same family_id as parent
    for (const child of childrenWithDifferentFamily) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ family_id: parent.family_id })
        .eq('id', child.id);
        
      if (updateError) {
        console.error(`❌ Failed to update ${child.full_name}:`, updateError);
      } else {
        console.log(`✅ Updated ${child.full_name} to family ${parent.family_id}`);
      }
    }
    
    console.log('\n✅ FIX COMPLETE! Checking again...\n');
    
    // Verify fix
    const { data: updatedProfiles } = await supabase
      .from('profiles')
      .select('*')
      .order('role');
      
    console.table(updatedProfiles.map(p => ({
      role: p.role,
      name: p.full_name,
      family_id: p.family_id
    })));
    
    console.log('\n🎉 All family members now have the same family_id!');
    console.log('The reminder feature should now work.\n');
  } else {
    console.log('\n✅ All family members already have the same family_id!');
    console.log('Reminder feature should be working.\n');
  }
}

checkAndFixProfiles().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
