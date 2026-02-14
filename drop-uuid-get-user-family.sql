-- ============================================================================
-- Drop UUID-returning get_user_family function
-- ============================================================================
-- Run this after confirming the signature from check-get-user-family-signatures.sql
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Dropping UUID-returning get_user_family function...';
END $$;

-- Try dropping various possible signatures
-- (We'll keep the TEXT-returning version)

-- Option 1: No arguments, returns UUID
DROP FUNCTION IF EXISTS public.get_user_family() CASCADE;

-- Option 2: UUID argument, returns UUID  
DROP FUNCTION IF EXISTS public.get_user_family(uuid) CASCADE;

-- Option 3: TEXT argument, returns UUID (unlikely but possible)
DROP FUNCTION IF EXISTS public.get_user_family(text) CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped UUID-returning get_user_family signatures';
  RAISE NOTICE 'Keeping: get_user_family_text() which returns TEXT';
END $$;

-- ============================================================================
-- Verify only TEXT-returning version remains
-- ============================================================================

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) LIKE '%text%' THEN '✅ TEXT (correct)'
    WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN '❌ UUID (should be dropped)'
    ELSE '⚠️ ' || pg_get_function_result(p.oid)
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE 'get_user_family%'
ORDER BY p.proname;

-- Expected result:
-- get_user_family_text | TEXT | ✅ TEXT (correct)

DO $$
DECLARE
  v_uuid_functions INTEGER;
BEGIN
  -- Count remaining UUID-returning get_user_family functions
  SELECT COUNT(*) INTO v_uuid_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'get_user_family'
    AND pg_get_function_result(p.oid) LIKE '%uuid%';
  
  IF v_uuid_functions = 0 THEN
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ SUCCESS: All UUID signatures removed';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Only TEXT-returning versions remain.';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Update any policies using get_user_family()';
    RAISE NOTICE 'to use get_user_family_text() instead.';
  ELSE
    RAISE WARNING '====================================';
    RAISE WARNING '⚠️ Still found % UUID-returning functions', v_uuid_functions;
    RAISE WARNING '====================================';
    RAISE WARNING 'May need manual DROP with specific signature.';
  END IF;
END $$;

-- ============================================================================
-- Check for policies using the old function
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  'Check if uses get_user_family()' as note
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%get_user_family(%' OR with_check LIKE '%get_user_family(%')
  AND (qual NOT LIKE '%get_user_family_text%' AND with_check NOT LIKE '%get_user_family_text%')
ORDER BY tablename, policyname;

-- Expected: No results (all policies should use get_user_family_text)
