-- ============================================================================
-- SCHEMA INSPECTION: Check profiles table structure
-- ============================================================================
-- SAFE READ-ONLY QUERY - Shows all columns in profiles table
-- ============================================================================

-- Show all columns in profiles table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if subscription columns exist
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
        AND column_name = 'subscription_status'
    ) THEN '✅ subscription_status exists'
    ELSE '❌ subscription_status MISSING'
  END as status_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
        AND column_name = 'subscription_starts_at'
    ) THEN '✅ subscription_starts_at exists'
    ELSE '❌ subscription_starts_at MISSING'
  END as starts_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
        AND column_name = 'subscription_renews_at'
    ) THEN '✅ subscription_renews_at exists'
    ELSE '❌ subscription_renews_at MISSING'
  END as renews_column,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
        AND column_name = 'license_key'
    ) THEN '✅ license_key exists'
    ELSE '❌ license_key MISSING'
  END as license_column;

-- ============================================================================
-- NEXT STEPS BASED ON RESULTS:
-- ============================================================================
-- ✅ If columns exist:
--    → Something is wrong with the query syntax
--    → Share the error message with me
--
-- ❌ If columns DON'T exist:
--    → Need to run add-premium-subscription-support.sql first
--    → This script adds the required subscription columns
-- ============================================================================
