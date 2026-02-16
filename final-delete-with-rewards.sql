-- ============================================================================
-- FINAL DELETE - Clean up rewards first, then delete everything
-- ============================================================================
-- User: bd1bb7db-f19b-4d16-b61f-42632d414f2e (kometsinkanyezi@gmail.com)
-- Family: 3c2388ee-148a-4b3c-9a2e-f56236826946
-- ============================================================================

-- Step 1: Delete rewards (the blocker!)
DELETE FROM rewards WHERE family_id = '3c2388ee-148a-4b3c-9a2e-f56236826946';

-- Step 2: Delete family
DELETE FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946';

-- Step 3: Delete profile (should already be gone, but try anyway)
DELETE FROM profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- Step 4: Delete auth.users (the final step)
DELETE FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- Verify
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
      AND NOT EXISTS (SELECT 1 FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946')
    THEN '✅✅ SUCCESS - User fully deleted! Ready to test registration!'
    ELSE '❌ Still exists - check above for errors'
  END as result;

-- Show remaining users (should be 7 now, down from 8)
SELECT 
  COUNT(*) as total_users_remaining,
  'If this is 7, deletion succeeded!' as note
FROM auth.users;
