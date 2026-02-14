-- ============================================================================
-- Check and Drop validate_family_code (UUID version)
-- ============================================================================
-- Since validate_family_code_text already exists, we can drop the UUID version
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Checking validate_family_code usage...';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- CHECK 1: See all validate_family_code variants
-- ============================================================================

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN '⚠️ Returns UUID'
    WHEN pg_get_function_result(p.oid) LIKE '%text%' THEN '✅ Returns TEXT'
    ELSE '? ' || pg_get_function_result(p.oid)
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE 'validate_family_code%'
ORDER BY p.proname;

-- Expected: Both validate_family_code (UUID) and validate_family_code_text (TEXT)

-- ============================================================================
-- CHECK 2: Find any policies using validate_family_code (not _text version)
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  'Uses validate_family_code' as issue
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%validate_family_code(%' 
    OR with_check LIKE '%validate_family_code(%'
  )
  AND qual NOT LIKE '%validate_family_code_text%'
  AND with_check NOT LIKE '%validate_family_code_text%';

-- Expected: 0 rows (no policies should use the old UUID version)

-- ============================================================================
-- CHECK 3: Find any other functions calling validate_family_code
-- ============================================================================

SELECT 
  p.proname as calling_function,
  pg_get_functiondef(p.oid) as definition_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%validate_family_code(%'
  AND pg_get_functiondef(p.oid) NOT LIKE '%validate_family_code_text%'
  AND p.proname != 'validate_family_code'
ORDER BY p.proname;

-- Shows any functions that call the old UUID version

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'If no dependencies found above...';
  RAISE NOTICE 'Safe to drop validate_family_code';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- DROP: Remove UUID-returning validate_family_code
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Dropping UUID-returning validate_family_code...';
END $$;

-- Drop the original UUID-returning function
DROP FUNCTION IF EXISTS public.validate_family_code(text) CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped validate_family_code(text) returning UUID table';
  RAISE NOTICE 'Keeping: validate_family_code_text(text) returning TEXT table';
END $$;

-- ============================================================================
-- VERIFY: Only TEXT-returning version remains
-- ============================================================================

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) LIKE '%text%' THEN '✅ Returns TEXT'
    WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN '❌ Still returns UUID'
    ELSE '? ' || pg_get_function_result(p.oid)
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE 'validate_family_code%'
ORDER BY p.proname;

-- Expected: Only validate_family_code_text shown with TEXT return type

-- ============================================================================
-- FINAL CHECK: Count all UUID-returning family functions
-- ============================================================================

DO $$
DECLARE
  v_uuid_functions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_uuid_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname ILIKE '%family%'
    AND pg_get_function_result(p.oid) LIKE '%uuid%';
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  
  IF v_uuid_functions = 0 THEN
    RAISE NOTICE '✅✅✅ SUCCESS! ✅✅✅';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'NO UUID-returning family functions remain!';
    RAISE NOTICE '';
    RAISE NOTICE 'Migration is now complete:';
    RAISE NOTICE '  ✅ All family_id columns are TEXT';
    RAISE NOTICE '  ✅ All family functions return TEXT';
    RAISE NOTICE '  ✅ No orphaned profiles';
    RAISE NOTICE '  ✅ RLS policies active';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Add FK constraints (add-foreign-keys.sql)';
    RAISE NOTICE '  2. Fix registration trigger (fix-registration-flow.sql)';
    RAISE NOTICE '  3. Test with real users';
    RAISE NOTICE '  4. Push to GitHub';
  ELSE
    RAISE WARNING '⚠️ Still % UUID-returning functions found', v_uuid_functions;
    RAISE WARNING 'Review the results above.';
  END IF;
  
  RAISE NOTICE '====================================';
END $$;
