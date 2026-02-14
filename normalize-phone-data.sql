-- ============================================================================
-- Normalize Phone Data: Convert Empty Strings to NULL
-- ============================================================================
-- Clean up existing data and prevent future empty strings
-- ============================================================================

-- Step 1: Update existing empty strings to NULL
UPDATE profiles
SET phone = NULL
WHERE phone = '';

-- Step 2: Add a check constraint to prevent future empty strings
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_phone_not_empty;

ALTER TABLE profiles
ADD CONSTRAINT profiles_phone_not_empty
CHECK (phone IS NULL OR phone != '');

-- Verification
SELECT 
  COUNT(*) as total_profiles,
  COUNT(phone) as profiles_with_phone,
  COUNT(*) - COUNT(phone) as profiles_without_phone
FROM profiles;

SELECT 
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname = 'profiles_phone_not_empty';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ PHONE DATA NORMALIZED';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  1. Converted all empty phone strings to NULL';
  RAISE NOTICE '  2. Added check constraint to prevent future empty strings';
  RAISE NOTICE '  3. Phone is now either NULL or a valid non-empty string';
  RAISE NOTICE '';
  RAISE NOTICE 'Benefits:';
  RAISE NOTICE '  - Consistent data (no mix of NULL and empty strings)';
  RAISE NOTICE '  - Simpler queries (just check IS NULL)';
  RAISE NOTICE '  - Partial unique index works perfectly';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;
