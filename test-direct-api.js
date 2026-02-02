// test-direct-api.js
const { createClient } = require('@supabase/supabase-js');

// Load your .env.local (if dotenv is available)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (err) {
  // dotenv not available, use existing environment variables
  console.log('ℹ️  Using environment variables (dotenv not available)');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 TESTING DIRECT API CALL');
console.log('==========================');
console.log('URL:', supabaseUrl);
console.log('Key exists:', !!supabaseKey);
console.log('Key starts with eyJ:', supabaseKey?.startsWith('eyJ'));

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  try {
    console.log('\n🧪 Testing signup...');
    
    // Test 1: Try without email/password (should fail)
    console.log('Test 1: Anonymous signup (should fail)');
    const { error: anonError } = await supabase.auth.signUp({});
    if (anonError) {
      console.log('✅ Expected error:', anonError.message);
    }
    
    // Test 2: Try with email/password (should work if key is correct)
    console.log('\nTest 2: Email/password signup');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    });
    
    if (error) {
      console.log('❌ Signup failed:', error.message);
      
      if (error.message.includes('JWT')) {
        console.log('⚠️  Your anon key is invalid!');
        console.log('Get the correct JWT token from Supabase Dashboard → API Settings');
      } else if (error.message.includes('Anonymous')) {
        console.log('⚠️  Supabase is still expecting anonymous auth');
        console.log('Enable Anonymous auth in Supabase Dashboard → Authentication → Providers');
      }
    } else {
      console.log('✅ Signup successful!');
      console.log('User ID:', data.user?.id);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

testSignup();
