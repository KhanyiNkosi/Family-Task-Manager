-- ============================================================================
-- STEP-BY-STEP DELETION with error reporting
-- ============================================================================
-- User: bd1bb7db-f19b-4d16-b61f-42632d414f2e
-- Family: 3c2388ee-148a-4b3c-9a2e-f56236826946
-- Run each step and report any errors
-- ============================================================================

-- STEP 1: Delete profile (removes family_id reference)
DELETE FROM profiles 
WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- Check: Should return 0 rows
SELECT COUNT(*) as profiles_remaining 
FROM profiles 
WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- STEP 2: Delete family (no longer referenced by profile)
DELETE FROM families 
WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946';

-- Check: Should return 0 rows
SELECT COUNT(*) as families_remaining 
FROM families 
WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946';

-- STEP 3: Delete from auth.users (final step)
DELETE FROM auth.users 
WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- Check: Should return 0 rows
SELECT COUNT(*) as users_remaining 
FROM auth.users 
WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- FINAL VERIFICATION
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
      AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
      AND NOT EXISTS (SELECT 1 FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946')
    THEN '✅ DELETION COMPLETE - Ready to test new registration!'
    ELSE '❌ Some records still exist - check errors above'
  END as final_status;
