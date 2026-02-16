-- ============================================================================
-- DIRECT DELETE - No error handling, see real error messages
-- ============================================================================
-- This will FAIL and show the exact PostgreSQL error
-- User 1: bd1bb7db-f19b-4d16-b61f-42632d414f2e
-- Family: 3c2388ee-148a-4b3c-9a2e-f56236826946
-- ============================================================================

-- Try 1: Delete family directly
DELETE FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946';

-- If above succeeded, try profile (should fail - already deleted)
DELETE FROM profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- If above succeeded, try auth.users
DELETE FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- Verify
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
    THEN '✅ SUCCESS - User deleted!'
    ELSE '❌ FAILED - User still exists'
  END as result;
