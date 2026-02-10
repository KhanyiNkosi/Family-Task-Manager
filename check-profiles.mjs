import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProfiles() {
  console.log('\n=== Checking Profiles Table ===\n');
  
  // Get all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('family_id');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total profiles:', profiles.length);
  console.table(profiles.map(p => ({
    id: p.id.substring(0, 8) + '...',
    name: p.full_name,
    role: p.role,
    family_id: p.family_id,
    email: p.email
  })));
  
  // Check distinct roles
  const roles = [...new Set(profiles.map(p => p.role))];
  console.log('\nDistinct roles found:', roles);
  
  // Check for null family_ids
  const nullFamilyIds = profiles.filter(p => !p.family_id);
  if (nullFamilyIds.length > 0) {
    console.log('\n⚠️ WARNING: Found', nullFamilyIds.length, 'profiles with NULL family_id');
  }
  
  // Check family relationships
  console.log('\n=== Family Relationships ===\n');
  const families = {};
  profiles.forEach(p => {
    if (!families[p.family_id]) {
      families[p.family_id] = { parents: [], children: [] };
    }
    if (p.role === 'parent') {
      families[p.family_id].parents.push(p.full_name);
    } else if (p.role === 'child') {
      families[p.family_id].children.push(p.full_name);
    }
  });
  
  Object.entries(families).forEach(([familyId, members]) => {
    const status = members.parents.length === 0 ? '❌ NO PARENT' : '✅';
    console.log(`${status} Family ${familyId}:`);
    console.log(`  Parents: ${members.parents.join(', ') || 'NONE'}`);
    console.log(`  Children: ${members.children.join(', ') || 'NONE'}\n`);
  });
}

checkProfiles().then(() => process.exit(0));
