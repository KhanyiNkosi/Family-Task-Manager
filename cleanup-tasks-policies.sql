-- ============================================================================
-- CLEANUP: Remove Redundant ::text Casts from Tasks Policies
-- ============================================================================
-- This fixes 3 tasks policies that have redundant ::text casts
-- After function conversion, these casts are no longer needed
-- ============================================================================

BEGIN;

-- ============================================================================
-- Show current policies before updating
-- ============================================================================

SELECT 
  'BEFORE UPDATE' as status,
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
  AND policyname IN ('tasks_parents_delete', 'tasks_parents_insert', 'tasks_parents_update')
ORDER BY policyname;

-- ============================================================================
-- FIX 1: tasks_parents_delete - Remove ::text from USING clause
-- ============================================================================

DROP POLICY IF EXISTS tasks_parents_delete ON tasks;

CREATE POLICY tasks_parents_delete ON tasks
  FOR DELETE
  TO authenticated
  USING (
    family_id = get_current_user_family_id()  -- ✅ No ::text cast needed
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
    )
  );

RAISE NOTICE '✅ Updated tasks_parents_delete (removed ::text cast)';

-- ============================================================================
-- FIX 2: tasks_parents_insert - Remove ::text from WITH CHECK clause
-- ============================================================================

DROP POLICY IF EXISTS tasks_parents_insert ON tasks;

CREATE POLICY tasks_parents_insert ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = get_current_user_family_id()  -- ✅ No ::text cast needed
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
    )
  );

RAISE NOTICE '✅ Updated tasks_parents_insert (removed ::text cast)';

-- ============================================================================
-- FIX 3: tasks_parents_update - Remove ::text from both USING and WITH CHECK
-- ============================================================================

DROP POLICY IF EXISTS tasks_parents_update ON tasks;

CREATE POLICY tasks_parents_update ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    family_id = get_current_user_family_id()  -- ✅ No ::text cast needed
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
    )
  )
  WITH CHECK (
    family_id = get_current_user_family_id()  -- ✅ No ::text cast needed
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'parent'
    )
  );

RAISE NOTICE '✅ Updated tasks_parents_update (removed ::text casts)';

COMMIT;

-- ============================================================================
-- VERIFICATION: Show updated policies
-- ============================================================================

SELECT 
  'AFTER UPDATE' as status,
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause,
  CASE 
    WHEN qual LIKE '%::text%' OR with_check LIKE '%::text%' 
    THEN '❌ Still has ::text'
    ELSE '✅ Clean'
  END as cast_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
  AND policyname IN ('tasks_parents_delete', 'tasks_parents_insert', 'tasks_parents_update')
ORDER BY policyname;

-- Expected: All should show '✅ Clean'

-- ============================================================================
-- BONUS: Check for any other policies with ::text casts
-- ============================================================================

SELECT 
  'OTHER POLICIES WITH ::text CASTS' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%::text%' OR with_check LIKE '%::text%')
  AND (
    qual LIKE '%get_current_user_family_id%'
    OR qual LIKE '%get_parent_id_for_family%'
    OR qual LIKE '%get_user_family%'
    OR with_check LIKE '%get_current_user_family_id%'
    OR with_check LIKE '%get_parent_id_for_family%'
    OR with_check LIKE '%get_user_family%'
  )
ORDER BY tablename, policyname;

-- Expected: Should return 0 rows after this fix

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_remaining_casts INTEGER;
BEGIN
  -- Count remaining policies with ::text casts on family functions
  SELECT COUNT(*) INTO v_remaining_casts
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual LIKE '%::text%' OR with_check LIKE '%::text%')
    AND (
      qual LIKE '%get_current_user_family_id%'
      OR qual LIKE '%get_parent_id_for_family%'
      OR qual LIKE '%get_user_family%'
      OR with_check LIKE '%get_current_user_family_id%'
      OR with_check LIKE '%get_parent_id_for_family%'
      OR with_check LIKE '%get_user_family%'
    );
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TASKS POLICIES CLEANUP COMPLETE';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Updated tasks_parents_delete';
  RAISE NOTICE '✅ Updated tasks_parents_insert';
  RAISE NOTICE '✅ Updated tasks_parents_update';
  RAISE NOTICE '';
  RAISE NOTICE 'Remaining policies with ::text casts: %', v_remaining_casts;
  
  IF v_remaining_casts = 0 THEN
    RAISE NOTICE '✅ All policies clean - no redundant casts!';
  ELSE
    RAISE NOTICE '⚠️ % policies still need cleanup', v_remaining_casts;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run verify-migration-complete.sql';
  RAISE NOTICE '2. Test task operations with real users';
  RAISE NOTICE '3. Monitor for any type mismatch errors';
  RAISE NOTICE '====================================';
END $$;
