// final-test.js - Test everything
const { createClient } = require('@supabase/supabase-js');

console.log('🎯 FINAL TEST: REGISTER PAGE FIX');
console.log('===============================');

// Load environment
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n1. Environment check:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Anon Key: ${anonKey ? '✓ Set' : '✗ Missing'}`);

if (!anonKey) {
    console.log('\n❌ STOP: No anon key found in .env.local');
    console.log('   Run: powershell -File update-env.ps1');
    process.exit(1);
}

if (!anonKey.startsWith('eyJ')) {
    console.log(`\n⚠️  WARNING: Anon key doesn't look like a JWT: "${anonKey.substring(0, 30)}..."`);
    console.log('   It should start with "eyJ" (JWT token)');
}

console.log('\n2. Testing Supabase connection...');
const supabase = createClient(supabaseUrl, anonKey);

async function runTests() {
    try {
        // Test 1: Get session (checks auth connection)
        const { data: session, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.log(`   ❌ Auth error: ${sessionError.message}`);
            
            if (sessionError.message.includes('JWT')) {
                console.log('   ⚠️  Your anon key is invalid or not a JWT token');
                console.log('   Get the correct key from Supabase Dashboard → Settings → API');
            }
        } else {
            console.log('   ✅ Auth connection successful');
        }
        
        // Test 2: Try to sign up (simulate register page)
        console.log('\n3. Testing registration (simulated)...');
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';
        
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: testEmail,
            password: testPassword,
            options: {
                emailRedirectTo: 'http://localhost:3000/auth/callback'
            }
        });
        
        if (signupError) {
            console.log(`   ❌ Signup error: ${signupError.message}`);
            
            if (signupError.message.includes('Anonymous')) {
                console.log('   ⚠️  This means your register page code is missing email/password parameters!');
                console.log('   Fix your register page to include email and password in supabase.auth.signUp()');
            } else if (signupError.message.includes('JWT')) {
                console.log('   ⚠️  Your anon key is invalid');
            }
        } else {
            console.log(`   ✅ Signup successful for: ${testEmail}`);
            console.log(`   User ID: ${signupData.user?.id}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Unexpected error: ${error.message}`);
    }
}

runTests().then(() => {
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    console.log('===================');
    console.log('\nIf signup works here but not in your app:');
    console.log('1. Your register page code is the problem');
    console.log('2. Check app/register/page.tsx for supabase.auth.signUp() call');
    console.log('3. Make sure it includes email and password parameters');
    
    console.log('\n🚀 Next command: npm run dev:env');
});
