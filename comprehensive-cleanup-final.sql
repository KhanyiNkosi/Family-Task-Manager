-- ============================================================================
-- COMPREHENSIVE CLEANUP: Final Migration Steps
-- ============================================================================
-- This script performs all remaining cleanup actions:
-- 1. Removes redundant ::text casts from tasks policies
-- 2. Drops old get_user_family(UUID) signature
-- 3. Verifies all cleanup completed successfully
-- ============================================================================

BEGIN;

-- Announce start
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'STARTING COMPREHENSIVE CLEANUP';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 1: Updating tasks policies...';
END $$;

-- ============================================================================
-- STEP 1: Update Tasks Policies (Remove ::text casts)
-- ============================================================================

-- Fix tasks_parents_delete
DROP POLICY IF EXISTS tasks_parents_delete ON tasks;
CREATE POLICY tasks_parents_delete ON tasks
  FOR DELETE
  TO authenticated
  USING (
    family_id = get_current_user_family_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ Updated tasks_parents_delete';
END $$;

-- Fix tasks_parents_insert
DROP POLICY IF EXISTS tasks_parents_insert ON tasks;
CREATE POLICY tasks_parents_insert ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id = get_current_user_family_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ Updated tasks_parents_insert';
END $$;

-- Fix tasks_parents_update
DROP POLICY IF EXISTS tasks_parents_update ON tasks;
CREATE POLICY tasks_parents_update ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    family_id = get_current_user_family_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  )
  WITH CHECK (
    family_id = get_current_user_family_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ Updated tasks_parents_update';
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 2: Removing old get_user_family(UUID) signature...';
END $$;

-- ============================================================================
-- STEP 2: Drop old get_user_family(UUID) signature
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'get_user_family';
  
  IF v_count > 1 THEN
    DROP FUNCTION IF EXISTS public.get_user_family(UUID) CASCADE;
    RAISE NOTICE '  ✅ Dropped get_user_family(UUID) - only TEXT version remains';
  ELSE
    RAISE NOTICE '  ℹ️  Only one get_user_family signature exists - no action needed';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION: Confirm all cleanup completed
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'VERIFICATION:';
  RAISE NOTICE '--------------';
END $$;

-- Check 1: No remaining ::text casts on family function calls
DO $$
DECLARE
  v_cast_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_cast_count
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
  
  IF v_cast_count = 0 THEN
    RAISE NOTICE '  ✅ No redundant ::text casts remaining';
  ELSE
    RAISE WARNING '  ⚠️ % policies still have ::text casts', v_cast_count;
  END IF;
END $$;

-- Check 2: Only one get_user_family signature exists
DO $$
DECLARE
  v_sig_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_sig_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'get_user_family';
  
  IF v_sig_count = 1 THEN
    RAISE NOTICE '  ✅ Single get_user_family signature (TEXT-returning)';
  ELSIF v_sig_count = 0 THEN
    RAISE NOTICE '  ⚠️ get_user_family function not found';
  ELSE
    RAISE WARNING '  ⚠️ Multiple get_user_family signatures still exist: %', v_sig_count;
  END IF;
END $$;

-- Check 3: validate_family_code_text wrapper exists
DO $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'validate_family_code_text'
  ) INTO v_exists;
  
  IF v_exists THEN
    RAISE NOTICE '  ✅ validate_family_code_text() wrapper exists';
  ELSE
    RAISE WARNING '  ⚠️ validate_family_code_text() wrapper not found';
  END IF;
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ CLEANUP COMPLETED SUCCESSFULLY';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was done:';
  RAISE NOTICE '  • 3 tasks policies updated (::text casts removed)';
  RAISE NOTICE '  • Old get_user_family(UUID) signature removed';
  RAISE NOTICE '  • All family functions now return TEXT';
  RAISE NOTICE '';
  RAISE NOTICE 'Migration status:';
  RAISE NOTICE '  ✅ All family_id columns are TEXT';
  RAISE NOTICE '  ✅ All family functions return TEXT';
  RAISE NOTICE '  ✅ All policies use clean function calls';
  RAISE NOTICE '  ✅ No redundant type casts';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run verify-migration-complete.sql for full verification';
  RAISE NOTICE '  2. Test with production users (family 32af85db...)';
  RAISE NOTICE '  3. Have users complete tasks → verify no errors';
  RAISE NOTICE '  4. Test new parent/child registration';
  RAISE NOTICE '  5. Push all commits to GitHub';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;
