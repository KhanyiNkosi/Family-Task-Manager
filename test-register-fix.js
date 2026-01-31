// test-register-fix.js - Quick test
console.log('🧪 TESTING REGISTER FIX');
console.log('=======================');

// Simulate what your register page needs
const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('\nChecking required variables:');
let allPresent = true;

requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    const isPresent = !!value;
    const status = isPresent ? '✓' : '✗';
    
    console.log(`${status} ${varName}: ${isPresent ? 'Set' : 'Missing'}`);
    
    if (!isPresent) {
        allPresent = false;
    } else if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        // Check if it's a JWT
        if (value.startsWith('eyJ')) {
            console.log('  ✅ Valid JWT format');
        } else {
            console.log(`  ⚠️  Not a JWT: "${value.substring(0, 20)}..."`);
            allPresent = false;
        }
    }
});

console.log('\n' + (allPresent ? '✅ All requirements met!' : '❌ Missing requirements'));
console.log(allPresent ? 'Your register page should work now!' : 'Fix the issues above');

if (!allPresent) {
    console.log('\n🔧 To fix:');
    console.log('1. Edit .env.local');
    console.log('2. Add: NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (from Supabase)');
    console.log('3. Run: npm run dev:env');
}
