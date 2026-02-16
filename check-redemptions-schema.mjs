import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking reward_redemptions schema...\n');
  
  // Get sample data to see columns
  const { data, error } = await supabase
    .from('reward_redemptions')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns in reward_redemptions:');
    Object.keys(data[0]).forEach(col => console.log(`  - ${col}`));
  } else {
    console.log('No data in table');
  }
}

checkSchema().catch(console.error);
