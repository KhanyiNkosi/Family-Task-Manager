// test-confirmation-flow.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Confirmation Email Flow...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  const testEmail = `test-confirm-${Date.now()}@test.com`;
  
  console.log('1. Attempting signup with email:', testEmail);
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestPassword123!',
    options: {
      emailRedirectTo: 'http://localhost:3000/auth/callback'
    }
  });

  if (error) {
    console.log('❌ Signup error:', error.message);
  } else {
    console.log('✅ Signup successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email sent:', data.user?.email_confirmed_at ? 'Already confirmed' : 'Confirmation email should be sent');
    
    if (data.user && !data.user.email_confirmed_at) {
      console.log('\n⚠️  IMPORTANT: Check if email was received.');
      console.log('   - Check your email inbox for:', testEmail);
      console.log('   - The email should contain a REAL URL, not "{{ .ConfirmationURL }}"');
      console.log('   - If you see the template text, update your Supabase email template');
    }
  }
}

testSignup();
