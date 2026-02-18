-- ============================================================================
-- Check current RLS policies for registration operations
-- ============================================================================

-- Profiles: Need INSERT (trigger creates profile) and UPDATE (joining family)
SELECT 
  'PROFILES' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅'
    WHEN cmd = 'INSERT' THEN '✅ CRITICAL FOR REGISTRATION'
    WHEN cmd = 'UPDATE' THEN '✅ CRITICAL FOR JOINING FAMILY'
    ELSE '⚠️'
  END as importance
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd;

-- Families: Need INSERT (parent creates family)
SELECT 
  'FAMILIES' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ CRITICAL FOR PARENT REGISTRATION'
    WHEN cmd = 'UPDATE' THEN '✅ For family settings'
    ELSE '⚠️'
  END as importance
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'families'
ORDER BY cmd;
