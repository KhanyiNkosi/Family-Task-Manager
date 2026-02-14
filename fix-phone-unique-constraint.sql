-- ============================================================================
-- Fix Phone Unique Constraint: Allow Multiple NULL/Empty Phone Numbers
-- ============================================================================
-- Issue: Users without phone numbers get duplicate key errors
-- Solution: Use partial unique index that only applies when phone is not NULL
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_phone_unique;

-- Create a partial unique index that allows multiple NULL values
-- But prevents duplicate non-NULL phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx
ON profiles (phone)
WHERE phone IS NOT NULL AND phone != '';

-- Verification
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname = 'profiles_phone_unique_idx';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ PHONE CONSTRAINT FIXED';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Dropped profiles_phone_unique constraint';
  RAISE NOTICE '  - Created partial unique index';
  RAISE NOTICE '  - Allows multiple users without phone numbers';
  RAISE NOTICE '  - Still prevents duplicate phone numbers';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Users can now register without phone numbers!';
  RAISE NOTICE '====================================';
END $$;
