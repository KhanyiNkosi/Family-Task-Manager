-- ============================================================================
-- Verify Registration Trigger is Working Correctly
-- ============================================================================
-- Run this after executing fix-registration-flow.sql
-- ============================================================================

\echo '===================================='
\echo 'CHECK 1: Trigger Function Exists'
\echo '===================================='

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proname = 'handle_new_user' THEN '✅ Exists'
    ELSE '? Unknown'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';

\echo ''
\echo '===================================='
\echo 'CHECK 2: Trigger is Active'
\echo '===================================='

SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ Enabled'
    WHEN tgenabled = 'D' THEN '❌ Disabled'
    ELSE '? Status: ' || tgenabled
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

\echo ''
\echo '===================================='
\echo 'CHECK 3: Family Creation Stats'
\echo '===================================='

SELECT 
  COUNT(*) as total_families,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 day' THEN 1 END) as created_last_24h,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as created_last_7d,
  '✅ Families table active' as status
FROM families;

\echo ''
\echo '===================================='
\echo 'CHECK 4: Orphaned Profiles'
\echo '===================================='

SELECT 
  COUNT(*) as orphaned_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No orphans'
    ELSE '❌ ' || COUNT(*) || ' orphans found'
  END as status
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);

-- List any orphans if found
SELECT 
  p.id,
  p.email,
  p.role,
  p.family_id,
  p.created_at,
  '❌ Family missing' as issue
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id)
ORDER BY p.created_at DESC
LIMIT 10;

\echo ''
\echo '===================================='
\echo 'CHECK 5: Recent Registrations'
\echo '===================================='

SELECT 
  u.email,
  u.created_at as registered_at,
  p.role,
  SUBSTRING(p.family_id FROM 1 FOR 13) || '...' as family_id_truncated,
  CASE 
    WHEN f.id IS NOT NULL THEN '✅ Family exists'
    WHEN p.family_id IS NULL THEN '⚠️ No family assigned'
    ELSE '❌ Orphaned'
  END as family_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN families f ON p.family_id = f.id
WHERE u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC
LIMIT 20;

\echo ''
\echo '===================================='
\echo 'CHECK 6: Family Ownership'
\echo '===================================='

-- Check that families have valid owner_id (if column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'families' 
      AND column_name = 'owner_id'
  ) THEN
    RAISE NOTICE 'Checking family ownership...';
    
    PERFORM 1;
    -- Would run ownership check here but can't return results from DO block
  ELSE
    RAISE NOTICE '⚠️ families.owner_id column does not exist';
  END IF;
END $$;

SELECT 
  COUNT(*) as families_with_owner,
  COUNT(CASE WHEN owner_id IS NULL THEN 1 END) as families_without_owner
FROM families
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'families' 
    AND column_name = 'owner_id'
);

\echo ''
\echo '===================================='
\echo 'SUMMARY'
\echo '===================================='
\echo ''
\echo 'If all checks show ✅:'
\echo '  - Trigger is active and working'
\echo '  - No orphaned profiles'
\echo '  - New registrations create families'
\echo ''
\echo 'Next steps:'
\echo '  1. Test new parent signup'
\echo '  2. Test new child signup'
\echo '  3. Monitor for 24-48 hours'
\echo '  4. Push commits to GitHub'
