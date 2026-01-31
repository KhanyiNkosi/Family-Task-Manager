// test-supabase-only.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 DIRECT SUPABASE API TEST');
console.log('===========================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using URL:', supabaseUrl);
console.log('Key length:', supabaseKey?.length);
console.log('Key preview:', supabaseKey?.substring(0, 30) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  try {
    console.log('\n1. Testing client creation...');
    console.log('   Client created successfully');
    
    console.log('\n2. Testing auth configuration...');
    const { data: settings, error: settingsError } = await supabase.auth.getSession();
    if (settingsError) {
      console.log('   ❌ Auth error:', settingsError.message);
    } else {
      console.log('   ✅ Auth connection working');
    }
    
    console.log('\n3. Testing signup API call...');
    const testEmail = `test-${Date.now()}@familytask.com`;
    console.log('   Using email:', testEmail);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        data: { name: 'Test User', role: 'parent' },
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    });
    
    if (error) {
      console.log('   ❌ Signup failed:', error.message);
      console.log('   Error details:', JSON.stringify(error, null, 2));
      
      if (error.message.includes('Anonymous')) {
        console.log('\n   🔍 ROOT CAUSE IDENTIFIED:');
        console.log('   Supabase project has "Anonymous auth" DISABLED');
        console.log('   Fix: Enable it in Dashboard → Authentication → Providers');
      }
      
      if (error.message.includes('disabled') || error.message.includes('not enabled')) {
        console.log('\n   🔍 ROOT CAUSE IDENTIFIED:');
        console.log('   Email authentication might be disabled in project settings');
        console.log('   Fix: Check Dashboard → Authentication → Providers → Email');
      }
    } else {
      console.log('   ✅ Signup successful!');
      console.log('   User ID:', data.user?.id);
      console.log('   Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No (check email)');
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
    console.log('Stack:', err.stack);
  }
}

runTests();
