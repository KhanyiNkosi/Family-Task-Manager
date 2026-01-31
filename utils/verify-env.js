// utils/verify-env.js
console.log('🔍 ENVIRONMENT VERIFICATION');
console.log('===========================');

// Check client variables
console.log('\n📱 CLIENT VARIABLES (from .env.local):');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✓ "${supabaseUrl}"` : '✗ Missing');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? '✓ Set' : '✗ Missing');

if (anonKey) {
    if (anonKey.startsWith('eyJ')) {
        console.log('  ✓ Looks like a valid JWT token');
    } else if (anonKey.includes('supabase.co')) {
        console.log('  ⚠️  This looks like a URL, not a JWT key!');
    } else {
        console.log('  ⚠️  May not be a valid JWT token');
    }
}

// Check server variables
console.log('\n🖥️  SERVER VARIABLES (from .env.server.local):');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');

// Special check for your specific issue
console.log('\n🔧 REGISTER PAGE DIAGNOSIS:');
if (anonKey && anonKey.startsWith('eyJ')) {
    console.log('✅ Your register page SHOULD WORK with this anon key');
    console.log('   The issue was missing JWT token for authentication');
} else if (!anonKey) {
    console.log('❌ Register will FAIL: Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('   Get it from: https://supabase.com/dashboard/project/eailwpyubcopzikpblep/settings/api');
} else {
    console.log('❌ Register will FAIL: Invalid anon key format');
    console.log('   Should be a JWT token starting with "eyJ"');
}

console.log('\n🎯 ACTION REQUIRED:');
if (!anonKey || !anonKey.startsWith('eyJ')) {
    console.log('1. Go to Supabase Dashboard → Project → Settings → API');
    console.log('2. Copy "anon public" key (starts with "eyJhb...")');
    console.log('3. Paste it in .env.local as:');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
}

console.log('\n✅ To test: npm run dev:env');
