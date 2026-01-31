// test-env-direct.js
require('dotenv').config({ path: '.env.local' });

console.log('=== DIRECT ENV TEST ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'none');

console.log('\nNEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length);
  console.log('Key starts with eyJ:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('eyJ'));
  
  const parts = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.');
  console.log('JWT parts:', parts.length);
  
  if (parts.length === 3) {
    console.log('✅ Valid JWT format');
  } else {
    console.log('❌ Invalid JWT format');
  }
}

console.log('\nSUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'not set');
