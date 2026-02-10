import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkAuthUsers() {
  console.log('\n=== Checking Auth Users ===\n');
  
  // Check if we can access auth.users (requires service role key)
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log('Current logged-in user:', user ? user.email : 'None');
  
  // Check user_profiles table
  const { data: userProfiles, error } = await supabase
    .from('user_profiles')
    .select('*');
    
  if (error) {
    console.error('Error fetching user_profiles:', error);
  } else {
    console.log('\nUser Profiles:', userProfiles.length);
    if (userProfiles.length > 0) {
      console.table(userProfiles.map(up => ({
        id: up.id.substring(0, 8) + '...',
        role: up.role,
        points: up.total_points,
        tasks: up.completed_tasks
      })));
    }
  }
}

checkAuthUsers().then(() => process.exit(0));
