// tests/cleanup.js
const SupabaseTestHelper = require('./utils/supabaseTestHelper');

async function cleanup() {
  console.log('🧹 Starting test cleanup...');
  
  try {
    const helper = new SupabaseTestHelper();
    
    // Cleanup test users (e2e-*@example.com)
    await helper.cleanupTestUsers('e2e-%@example.com');
    
    // Also cleanup any test users created today (fallback)
    const today = new Date().toISOString().split('T')[0];
    await helper.cleanupTestUsers(`%-${today}@example.com`);
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanup();
}

module.exports = cleanup;
