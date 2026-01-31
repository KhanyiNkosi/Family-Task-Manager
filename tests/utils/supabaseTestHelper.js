// tests/utils/supabaseTestHelper.js
const { createClient } = require('@supabase/supabase-js');

class SupabaseTestHelper {
  constructor() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables for tests');
    }
    
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    );
  }

  /**
   * Delete a test user by email
   * @param {string} email - User email to delete
   */
  async deleteTestUser(email) {
    try {
      // First get the user ID by email
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (userError) {
        console.warn(`Could not find user ${email}:`, userError.message);
        return;
      }

      if (userData) {
        // Delete from users table
        const { error: deleteError } = await this.supabase
          .from('users')
          .delete()
          .eq('id', userData.id);

        if (deleteError) {
          console.warn(`Failed to delete user ${email}:`, deleteError.message);
        } else {
          console.log(`Deleted test user: ${email}`);
        }
      }
    } catch (error) {
      console.error('Error deleting test user:', error);
    }
  }

  /**
   * Delete all test users created by E2E tests
   * @param {string} pattern - Pattern to match test emails (default: 'e2e-*@example.com')
   */
  async cleanupTestUsers(pattern = 'e2e-%@example.com') {
    try {
      const { data: testUsers, error } = await this.supabase
        .from('users')
        .select('id, email')
        .like('email', pattern);

      if (error) {
        console.warn('Error fetching test users:', error.message);
        return;
      }

      if (testUsers && testUsers.length > 0) {
        console.log(`Found ${testUsers.length} test users to clean up`);
        
        for (const user of testUsers) {
          await this.supabase
            .from('users')
            .delete()
            .eq('id', user.id);
        }
        
        console.log(`Cleaned up ${testUsers.length} test users`);
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }

  /**
   * Create a test user directly (useful for setup)
   */
  async createTestUser(email, password, userData = {}) {
    const { data, error } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        ...userData,
        test_user: true,
        created_at: new Date().toISOString(),
      },
    });

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    return data.user;
  }
}

module.exports = SupabaseTestHelper;
