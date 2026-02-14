-- ============================================================================
-- FINALIZE FUNCTION CONVERSION: Cleanup & Wrapper Functions
-- ============================================================================
-- This script:
-- 1. Creates validate_family_code_text() wrapper (returns TEXT columns)
-- 2. Drops old get_user_family(UUID) signature (removes duplicate)
-- 3. Scans and reports policies with redundant ::text casts
-- 4. Verifies all functions are TEXT-compatible
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create validate_family_code_text() wrapper
-- ============================================================================
-- Problem: validate_family_code() returns TABLE(family_id uuid, owner_id uuid, ...)
-- Solution: Create wrapper that casts UUID columns to TEXT

CREATE OR REPLACE FUNCTION public.validate_family_code_text(p_code TEXT)
RETURNS TABLE(
  family_id TEXT,      -- Changed from UUID to TEXT
  owner_id TEXT,       -- Changed from UUID to TEXT
  name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.family_id::TEXT,  -- Cast UUID to TEXT
    v.owner_id::TEXT,   -- Cast UUID to TEXT
    v.name
  FROM validate_family_code(p_code) v;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_family_code_text(TEXT) TO authenticated;

RAISE NOTICE '✅ Created validate_family_code_text() wrapper (returns TEXT columns)';

-- ============================================================================
-- STEP 2: Drop old get_user_family(UUID) signature (if duplicate exists)
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count how many get_user_family signatures exist
  SELECT COUNT(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'get_user_family';
  
  IF v_count > 1 THEN
    -- Drop the UUID-returning version (keep TEXT version)
    -- Need to specify the argument type to drop the right one
    BEGIN
      DROP FUNCTION IF EXISTS public.get_user_family(UUID) CASCADE;
      RAISE NOTICE '✅ Dropped old get_user_family(UUID) signature (UUID-returning version removed)';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '⚠️ Could not drop old get_user_family(UUID): %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'ℹ️  Only one get_user_family signature exists - no cleanup needed';
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Scan for policies with redundant ::text casts
-- ============================================================================

SELECT 
  'POLICIES WITH REDUNDANT ::text CASTS' as report_section,
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%get_current_user_family_id()::text%' THEN 'get_current_user_family_id()::text → can remove ::text'
    WHEN qual LIKE '%get_parent_id_for_family(%)::text%' THEN 'get_parent_id_for_family()::text → can remove ::text'
    WHEN qual LIKE '%get_user_family(%)::text%' THEN 'get_user_family()::text → can remove ::text'
    WHEN with_check LIKE '%get_current_user_family_id()::text%' THEN 'get_current_user_family_id()::text → can remove ::text'
    WHEN with_check LIKE '%get_parent_id_for_family(%)::text%' THEN 'get_parent_id_for_family()::text → can remove ::text'
    WHEN with_check LIKE '%get_user_family(%)::text%' THEN 'get_user_family()::text → can remove ::text'
  END as cast_to_remove,
  qual as using_clause
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND (
    qual LIKE '%::text%' 
    OR with_check LIKE '%::text%'
  )
  AND (
    qual LIKE '%get_current_user_family_id%'
    OR qual LIKE '%get_parent_id_for_family%'
    OR qual LIKE '%get_user_family%'
    OR with_check LIKE '%get_current_user_family_id%'
    OR with_check LIKE '%get_parent_id_for_family%'
    OR with_check LIKE '%get_user_family%'
  )
ORDER BY schemaname, tablename, policyname;

-- NOTE: The output above shows policies that MAY have redundant casts
-- Review each one before removing casts

-- ============================================================================
-- STEP 4: Update policies that use validate_family_code
-- ============================================================================

DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE (qual LIKE '%validate_family_code%' OR with_check LIKE '%validate_family_code%')
    AND schemaname = 'public';
  
  IF v_policy_count > 0 THEN
    RAISE NOTICE '⚠️ Found % policies using validate_family_code', v_policy_count;
    RAISE NOTICE 'Recommendation: Update these policies to use validate_family_code_text() instead';
    RAISE NOTICE 'Example: ... FROM validate_family_code(code) v → ... FROM validate_family_code_text(code) v';
  ELSE
    RAISE NOTICE '✅ No policies found using validate_family_code';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION: Show all family-related functions and their return types
-- ============================================================================

SELECT 
  'FINAL FUNCTION SIGNATURES' as report_section,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) LIKE '%text%' THEN '✅ TEXT-compatible'
    WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN '⚠️ Returns UUID (needs wrapper or cast)'
    ELSE '✅ OK'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%family%'
    OR pg_get_functiondef(p.oid) ILIKE '%family_id%'
  )
ORDER BY p.proname, pg_get_function_arguments(p.oid);

-- ============================================================================
-- SUMMARY & RECOMMENDATIONS
-- ============================================================================

DO $$
DECLARE
  v_uuid_functions INTEGER;
  v_text_functions INTEGER;
  v_wrapper_exists BOOLEAN;
BEGIN
  -- Count UUID-returning functions
  SELECT COUNT(*) INTO v_uuid_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname ILIKE '%family%'
    AND pg_get_function_result(p.oid) LIKE '%uuid%';
  
  -- Count TEXT-returning functions
  SELECT COUNT(*) INTO v_text_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname ILIKE '%family%'
    AND pg_get_function_result(p.oid) LIKE '%text%';
  
  -- Check if wrapper exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'validate_family_code_text'
  ) INTO v_wrapper_exists;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '    FUNCTION CONVERSION SUMMARY';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'TEXT-returning functions: %', v_text_functions;
  RAISE NOTICE 'UUID-returning functions: %', v_uuid_functions;
  RAISE NOTICE '';
  
  IF v_wrapper_exists THEN
    RAISE NOTICE '✅ validate_family_code_text() wrapper created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining UUID-returning functions:';
  RAISE NOTICE '  • validate_family_code() - use validate_family_code_text() instead';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review "POLICIES WITH REDUNDANT ::text CASTS" output above';
  RAISE NOTICE '  2. Update policies to use validate_family_code_text()';
  RAISE NOTICE '  3. Remove redundant ::text casts from policies';
  RAISE NOTICE '  4. Run verify-migration-complete.sql again';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- OPTIONAL: Generate policy updates to remove redundant casts
-- ============================================================================
-- This section generates the SQL to update policies automatically
-- Review before executing!

DO $$
DECLARE
  v_policy RECORD;
  v_new_qual TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'SUGGESTED POLICY UPDATES (review before executing):';
  RAISE NOTICE '====================================';
  
  FOR v_policy IN (
    SELECT 
      schemaname,
      tablename,
      policyname,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        qual LIKE '%get_current_user_family_id()::text%'
        OR with_check LIKE '%get_current_user_family_id()::text%'
      )
  ) LOOP
    -- Generate SQL to recreate policy without cast
    v_new_qual := REPLACE(v_policy.qual, 'get_current_user_family_id()::text', 'get_current_user_family_id()');
    
    RAISE NOTICE '';
    RAISE NOTICE '-- Update: %.%', v_policy.tablename, v_policy.policyname;
    RAISE NOTICE 'DROP POLICY IF EXISTS % ON %;', v_policy.policyname, v_policy.tablename;
    RAISE NOTICE '-- Then recreate with updated USING clause (remove ::text cast)';
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No policies need ::text cast removal - all clean! ✅';
  END IF;
END $$;
