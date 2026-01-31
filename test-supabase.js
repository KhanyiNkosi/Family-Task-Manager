// quick test script to check Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('=== SUPABASE CLIENT TEST ===');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL exists:', !!supabaseUrl);
console.log('URL format:', supabaseUrl?.startsWith('http') ? '✅ Correct' : '❌ Wrong');
console.log('Key exists:', !!supabaseKey);
console.log('Key length:', supabaseKey?.length || 0);

if (supabaseUrl && supabaseKey) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
    
    // Test connection
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Auth test error:', error.message);
    } else {
      console.log('✅ Auth test passed');
    }
  } catch (err) {
    console.log('❌ Client creation error:', err.message);
  }
} else {
  console.log('❌ Missing environment variables');
}
