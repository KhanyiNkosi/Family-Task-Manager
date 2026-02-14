-- ============================================================================
-- CONVERT FAMILY FUNCTIONS: UUID → TEXT Return Types
-- ============================================================================
-- This converts all family-related functions from returning UUID to TEXT
-- Ensures consistency with TEXT family_id columns after migration
-- ============================================================================

BEGIN;

-- ============================================================================
-- BACKUP: Show current function signatures
-- ============================================================================

SELECT 
  'BEFORE CONVERSION' as status,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_current_user_family_id',
    'get_parent_id_for_family',
    'get_user_family',
    'validate_family_code'
  )
ORDER BY p.proname;

-- ============================================================================
-- FUNCTION 1: get_current_user_family_id() - UUID → TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_family_id()
RETURNS TEXT  -- Changed from UUID to TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;
BEGIN
  SELECT family_id::TEXT INTO v_family_id  -- Cast to TEXT
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN v_family_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_family_id() TO authenticated;

RAISE NOTICE '✅ Converted get_current_user_family_id() → returns TEXT';

-- ============================================================================
-- FUNCTION 2: get_parent_id_for_family() - UUID → TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_parent_id_for_family(p_family_id TEXT)
RETURNS TEXT  -- Changed from UUID to TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_id TEXT;
BEGIN
  SELECT id::TEXT INTO v_parent_id  -- Cast to TEXT
  FROM profiles
  WHERE family_id = p_family_id
    AND role = 'parent'
  LIMIT 1;
  
  RETURN v_parent_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_parent_id_for_family(TEXT) TO authenticated;

RAISE NOTICE '✅ Converted get_parent_id_for_family() → returns TEXT';

-- ============================================================================
-- FUNCTION 3: get_user_family() - UUID → TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_family(p_user_id UUID)
RETURNS TEXT  -- Changed from UUID to TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;
BEGIN
  SELECT family_id::TEXT INTO v_family_id  -- Cast to TEXT
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN v_family_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_family(UUID) TO authenticated;

RAISE NOTICE '✅ Converted get_user_family() → returns TEXT';

-- ============================================================================
-- FUNCTION 4: validate_family_code() - Returns BOOLEAN (no change needed)
-- ============================================================================
-- Note: This function likely validates family_code exists, check if it needs updating

-- Check if function exists and what it does
DO $$
DECLARE
  v_function_def TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_function_def
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'validate_family_code';
  
  IF v_function_def IS NOT NULL THEN
    IF v_function_def LIKE '%uuid%' OR v_function_def LIKE '%UUID%' THEN
      RAISE NOTICE '⚠️  validate_family_code() may need manual review for UUID→TEXT conversion';
      RAISE NOTICE 'Current definition: %', v_function_def;
    ELSE
      RAISE NOTICE '✅ validate_family_code() appears TEXT-compatible already';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  validate_family_code() not found - may not exist';
  END IF;
END $$;

-- ============================================================================
-- UPDATE POLICIES: Remove ::text casts (now unnecessary)
-- ============================================================================

-- Update the profiles policy to remove the cast (function now returns TEXT)
DROP POLICY IF EXISTS allow_select_family_profiles ON profiles;

CREATE POLICY allow_select_family_profiles ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (family_id IS NOT NULL) 
    AND (family_id = get_current_user_family_id())  -- No cast needed now!
  );

RAISE NOTICE '✅ Updated allow_select_family_profiles policy (removed ::text cast)';

-- ============================================================================
-- SCAN FOR OTHER POLICIES USING THESE FUNCTIONS
-- ============================================================================

SELECT 
  'POLICIES USING CONVERTED FUNCTIONS' as check,
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%get_current_user_family_id%' 
      OR with_check LIKE '%get_current_user_family_id%' THEN 'Uses get_current_user_family_id'
    WHEN qual LIKE '%get_parent_id_for_family%' 
      OR with_check LIKE '%get_parent_id_for_family%' THEN 'Uses get_parent_id_for_family'
    WHEN qual LIKE '%get_user_family%' 
      OR with_check LIKE '%get_user_family%' THEN 'Uses get_user_family'
    WHEN qual LIKE '%validate_family_code%' 
      OR with_check LIKE '%validate_family_code%' THEN 'Uses validate_family_code'
  END as function_used,
  CASE 
    WHEN qual LIKE '%::text%' OR with_check LIKE '%::text%' THEN '⚠️ Has ::text cast (can be removed)'
    ELSE '✅ No cast'
  END as cast_status
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND (
    qual LIKE '%get_current_user_family_id%'
    OR qual LIKE '%get_parent_id_for_family%'
    OR qual LIKE '%get_user_family%'
    OR qual LIKE '%validate_family_code%'
    OR with_check LIKE '%get_current_user_family_id%'
    OR with_check LIKE '%get_parent_id_for_family%'
    OR with_check LIKE '%get_user_family%'
    OR with_check LIKE '%validate_family_code%'
  )
ORDER BY schemaname, tablename, policyname;

COMMIT;

-- ============================================================================
-- VERIFICATION: Confirm functions now return TEXT
-- ============================================================================

SELECT 
  'AFTER CONVERSION' as status,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) = 'text' THEN '✅ RETURNS TEXT'
    WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN '❌ STILL RETURNS UUID'
    ELSE '⚠️ ' || pg_get_function_result(p.oid)
  END as status_check
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_current_user_family_id',
    'get_parent_id_for_family',
    'get_user_family',
    'validate_family_code',
    'get_user_family_text'
  )
ORDER BY p.proname;

-- ============================================================================
-- TEST: Verify function works correctly
-- ============================================================================

DO $$
DECLARE
  v_test_result TEXT;
BEGIN
  -- Test get_current_user_family_id (if user is authenticated)
  BEGIN
    SELECT get_current_user_family_id() INTO v_test_result;
    IF v_test_result IS NOT NULL THEN
      RAISE NOTICE '✅ get_current_user_family_id() test: returned "%"', v_test_result;
    ELSE
      RAISE NOTICE 'ℹ️  get_current_user_family_id() test: returned NULL (no authenticated user in this context)';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️  get_current_user_family_id() test failed: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ FUNCTION CONVERSION COMPLETE';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Converted functions:';
  RAISE NOTICE '  1. get_current_user_family_id() → TEXT';
  RAISE NOTICE '  2. get_parent_id_for_family() → TEXT';
  RAISE NOTICE '  3. get_user_family() → TEXT';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated policies:';
  RAISE NOTICE '  • allow_select_family_profiles (removed ::text cast)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Review "POLICIES USING CONVERTED FUNCTIONS" output above';
  RAISE NOTICE '  2. Remove ::text casts from any other policies if present';
  RAISE NOTICE '  3. Test with real users';
  RAISE NOTICE '  4. Run verify-migration-complete.sql again';
END $$;
