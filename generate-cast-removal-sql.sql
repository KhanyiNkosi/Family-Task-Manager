-- ============================================================================
-- GENERATE: SQL to Remove Redundant ::text Casts from Policies
-- ============================================================================
-- This script identifies policies with redundant ::text casts and generates
-- SQL statements to recreate them without the casts
-- Review the generated SQL before executing!
-- ============================================================================

-- ============================================================================
-- STEP 1: Identify policies with redundant casts
-- ============================================================================

SELECT 
  'Policies with redundant ::text casts' as section,
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  array_to_string(roles, ', ') as roles_list
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (qual LIKE '%get_current_user_family_id()::text%')
    OR (qual LIKE '%get_parent_id_for_family(%)::text%')
    OR (qual LIKE '%get_user_family(%)::text%')
    OR (with_check LIKE '%get_current_user_family_id()::text%')
    OR (with_check LIKE '%get_parent_id_for_family(%)::text%')
    OR (with_check LIKE '%get_user_family(%)::text%')
  )
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 2: Show policy definitions that need updates
-- ============================================================================

SELECT 
  '-- ======================================' as sql_statement
UNION ALL
SELECT '-- POLICIES TO UPDATE (remove ::text casts)'
UNION ALL
SELECT '-- Review and execute these statements'
UNION ALL
SELECT '-- ======================================'
UNION ALL
SELECT ''
UNION ALL
SELECT 
  format(
    '-- Policy: %s.%s%s-- Original USING: %s%s-- Action: Drop and recreate without ::text cast%sDROP POLICY IF EXISTS %I ON %I;%s',
    schemaname,
    tablename || '.' || policyname,
    E'\n',
    COALESCE(qual, 'N/A'),
    E'\n',
    E'\n',
    policyname,
    tablename,
    E'\n'
  )
FROM pg_policies
WHERE schemaname = 'public'
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
ORDER BY tablename, policyname;

-- ============================================================================
-- STEP 3: Example policy recreation (MANUAL - Review before using!)
-- ============================================================================

/*
EXAMPLE: If you have a policy like this:

CREATE POLICY allow_select_family_profiles ON profiles
  FOR SELECT TO authenticated
  USING (
    (family_id IS NOT NULL) 
    AND (family_id = (get_current_user_family_id())::text)  -- ❌ ::text cast
  );

UPDATE IT TO:

CREATE POLICY allow_select_family_profiles ON profiles
  FOR SELECT TO authenticated
  USING (
    (family_id IS NOT NULL) 
    AND (family_id = get_current_user_family_id())  -- ✅ No cast needed!
  );

The pattern:
1. DROP POLICY IF EXISTS <policy_name> ON <table_name>;
2. CREATE POLICY <policy_name> ON <table_name>
   FOR <SELECT|INSERT|UPDATE|DELETE>
   TO <role>
   USING (<expression without ::text>)
   [WITH CHECK (<expression without ::text>)];
*/

-- ============================================================================
-- STEP 4: List specific policies that need manual review
-- ============================================================================

DO $$
DECLARE
  v_policy RECORD;
  v_count INTEGER := 0;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'POLICIES NEEDING MANUAL UPDATE';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
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
    ORDER BY tablename, policyname
  ) LOOP
    v_count := v_count + 1;
    
    RAISE NOTICE 'Policy %: %.%', v_count, v_policy.tablename, v_policy.policyname;
    RAISE NOTICE '  USING clause: %', COALESCE(SUBSTRING(v_policy.qual, 1, 100), 'N/A');
    
    IF v_policy.qual LIKE '%::text%' THEN
      RAISE NOTICE '  ⚠️ Remove ::text from USING clause';
    END IF;
    
    IF v_policy.with_check IS NOT NULL AND v_policy.with_check LIKE '%::text%' THEN
      RAISE NOTICE '  ⚠️ Remove ::text from WITH CHECK clause';
    END IF;
    
    RAISE NOTICE '';
  END LOOP;
  
  IF v_count = 0 THEN
    RAISE NOTICE '✅ No policies found with redundant ::text casts';
    RAISE NOTICE 'All function calls are clean!';
  ELSE
    RAISE NOTICE 'Total policies to update: %', v_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Actions:';
    RAISE NOTICE '1. Review the policy definitions above';
    RAISE NOTICE '2. Drop each policy: DROP POLICY IF EXISTS <name> ON <table>;';
    RAISE NOTICE '3. Recreate without ::text cast';
    RAISE NOTICE '4. Test with verify-migration-complete.sql';
  END IF;
  
  RAISE NOTICE '====================================';
END $$;
