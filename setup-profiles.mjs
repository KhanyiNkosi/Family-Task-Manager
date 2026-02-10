import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setupProfiles() {
  console.log('\n=== Setting Up Profiles ===\n');
  
  // Get existing user_profiles
  const { data: userProfiles, error: upError } = await supabase
    .from('user_profiles')
    .select('*');
    
  if (upError || !userProfiles) {
    console.error('Error fetching user_profiles:', upError);
    return;
  }
  
  console.log(`Found ${userProfiles.length} users in user_profiles`);
  
  // Generate a family code for the family
  const familyId = randomBytes(8).toString('hex');
  console.log(`Generated family_id: ${familyId}\n`);
  
  // Create profile for each user
  for (const up of userProfiles) {
    const profile = {
      id: up.id,
      family_id: familyId,
      role: up.role,
      full_name: up.role === 'parent' ? 'Parent' : 'Child',
      email: `${up.role}@example.com`, // You can update this later
      profile_image: null
    };
    
    console.log(`Creating profile for ${up.role}...`);
    
    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profile);
      
    if (insertError) {
      console.error(`  ❌ Error creating profile for ${up.role}:`, insertError);
    } else {
      console.log(`  ✅ Profile created for ${up.role}`);
    }
  }
  
  // Verify
  console.log('\n=== Verification ===\n');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('role');
    
  console.table(profiles.map(p => ({
    id: p.id.substring(0, 8) + '...',
    name: p.full_name,
    role: p.role,
    family_id: p.family_id
  })));
  
  console.log('\n✅ Setup complete! Both users are now in the same family.');
  console.log('The reminder feature should now work.\n');
}

setupProfiles().then(() => process.exit(0));
