-- ============================================================================
-- LIGHTWEIGHT VERIFICATION: Current Function & Policy State
-- ============================================================================
-- Simple queries to verify function conversions without complex aggregations
-- ============================================================================

-- ============================================================================
-- CHECK 1: List all family-related functions (simple format)
-- ============================================================================

SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_current_user_family_id',
    'get_parent_id_for_family',
    'get_user_family',
    'get_user_family_text',
    'validate_family_code',
    'validate_family_code_text'
  )
ORDER BY p.proname, pg_get_function_arguments(p.oid);

-- ============================================================================
-- CHECK 2: Count get_user_family signatures
-- ============================================================================

SELECT 
  'get_user_family signature count' as check_type,
  COUNT(*) as signature_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_family';

-- ============================================================================
-- CHECK 3: Verify wrapper function exists
-- ============================================================================

SELECT 
  'validate_family_code_text exists' as check_type,
  COUNT(*) as exists_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'validate_family_code_text';

-- Expected: 1 if created successfully

-- ============================================================================
-- CHECK 4: List policies with ::text casts (simple query)
-- ============================================================================

SELECT 
  schemaname || '.' || tablename as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%::text%' THEN 'YES'
    ELSE 'NO'
  END as has_cast_in_using,
  CASE 
    WHEN with_check LIKE '%::text%' THEN 'YES'
    ELSE 'NO'
  END as has_cast_in_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%get_current_user_family_id%'
    OR qual LIKE '%get_parent_id_for_family%'
    OR qual LIKE '%get_user_family%'
    OR with_check LIKE '%get_current_user_family_id%'
    OR with_check LIKE '%get_parent_id_for_family%'
    OR with_check LIKE '%get_user_family%'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- CHECK 5: Policies using validate_family_code
-- ============================================================================

SELECT 
  schemaname || '.' || tablename as table_name,
  policyname,
  'Uses validate_family_code' as note
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual LIKE '%validate_family_code%'
    OR with_check LIKE '%validate_family_code%'
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_wrapper_count INTEGER;
  v_get_user_family_count INTEGER;
  v_text_function_count INTEGER;
BEGIN
  -- Check wrapper exists
  SELECT COUNT(*) INTO v_wrapper_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'validate_family_code_text';
  
  -- Count get_user_family signatures
  SELECT COUNT(*) INTO v_get_user_family_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'get_user_family';
  
  -- Count TEXT-returning family functions
  SELECT COUNT(*) INTO v_text_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('get_current_user_family_id', 'get_parent_id_for_family', 'get_user_family_text', 'validate_family_code_text')
    AND pg_get_function_result(p.oid) LIKE '%text%';
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'validate_family_code_text() exists: %', CASE WHEN v_wrapper_count > 0 THEN 'YES ✅' ELSE 'NO ❌' END;
  RAISE NOTICE 'get_user_family() signatures: %', v_get_user_family_count;
  RAISE NOTICE 'TEXT-returning functions: %', v_text_function_count;
  RAISE NOTICE '====================================';
END $$;
