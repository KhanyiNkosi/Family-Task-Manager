-- ============================================================================
-- FINAL VERIFICATION: Confirm Migration Success
-- ============================================================================
-- Run this after completing the family_id UUID → TEXT migration
-- ============================================================================

-- ============================================================================
-- CHECK 1: All family_id columns are TEXT
-- ============================================================================

SELECT 
  '1. TYPE VERIFICATION' as check_name,
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'text' THEN '✅ CORRECT'
    WHEN data_type = 'uuid' THEN '❌ STILL UUID - MIGRATION INCOMPLETE'
    ELSE '⚠️ UNEXPECTED: ' || data_type
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%family%'
    OR (table_name = 'families' AND column_name = 'id')
  )
ORDER BY 
  CASE WHEN data_type != 'text' THEN 1 ELSE 2 END,
  table_name,
  column_name;

-- Expected: ALL should show '✅ CORRECT'

-- ============================================================================
-- CHECK 2: No Orphaned Profiles
-- ============================================================================

SELECT 
  '2. ORPHAN CHECK' as check_name,
  COUNT(*) as orphaned_profiles,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO ORPHANS'
    ELSE '❌ ' || COUNT(*) || ' ORPHANED PROFILES FOUND'
  END as status
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);

-- Expected: 0 orphaned profiles

-- ============================================================================
-- CHECK 3: Foreign Key Constraints Exist
-- ============================================================================

SELECT 
  '3. FOREIGN KEYS' as check_name,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column,
  '✅ EXISTS' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND kcu.column_name LIKE '%family%'
ORDER BY tc.table_name;

-- Expected: At least profiles_family_id_fkey, activity_feed_family_id_fkey

-- ============================================================================
-- CHECK 4: RLS Policies Active on All Tables
-- ============================================================================

SELECT 
  '4. RLS POLICIES' as check_name,
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ PROTECTED'
    ELSE '⚠️ NO POLICIES'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name LIKE '%family%'
  )
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Expected: All tables with family_id should have policies

-- ============================================================================
-- CHECK 5: Specific Policy Verification
-- ============================================================================

-- Check the critical policy you just fixed
SELECT 
  '5. PROFILES POLICY' as check_name,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%::text%' OR with_check LIKE '%::text%' THEN '✅ HAS TEXT CAST'
    ELSE '⚠️ NO CAST FOUND (may still work)'
  END as has_cast,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND policyname = 'allow_select_family_profiles';

-- Expected: Policy exists with TEXT cast

-- ============================================================================
-- CHECK 6: Indexes Exist
-- ============================================================================

SELECT 
  '6. INDEXES' as check_name,
  schemaname,
  tablename,
  indexname,
  indexdef,
  '✅ EXISTS' as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%family%'
ORDER BY tablename, indexname;

-- Expected: Indexes on family_id columns for performance

-- ============================================================================
-- CHECK 7: Test Data Integrity
-- ============================================================================

-- Verify the known user family (32af85db-12f6-4d60-9995-f585aa973ba3)
SELECT 
  '7. DATA INTEGRITY' as check_name,
  p.id as profile_id,
  p.family_id,
  p.role,
  CASE 
    WHEN f.id IS NOT NULL THEN '✅ FAMILY EXISTS'
    ELSE '❌ FAMILY MISSING'
  END as family_status,
  f.id as family_table_id,
  CASE 
    WHEN p.family_id = f.id THEN '✅ IDs MATCH'
    ELSE '❌ ID MISMATCH'
  END as id_match_status
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id = '32af85db-12f6-4d60-9995-f585aa973ba3'
ORDER BY p.role DESC;

-- Expected: 2 users, both show '✅ FAMILY EXISTS' and '✅ IDS MATCH'

-- ============================================================================
-- CHECK 8: Function Return Type Compatibility
-- ============================================================================

SELECT 
  '8. FUNCTION CHECK' as check_name,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN '⚠️ RETURNS UUID (needs cast in policies)'
    WHEN pg_get_function_result(p.oid) LIKE '%text%' THEN '✅ RETURNS TEXT'
    ELSE pg_get_function_result(p.oid)
  END as compatibility_note
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname ILIKE '%family%'
ORDER BY p.proname;

-- Expected: Functions that return family_id noted with cast requirements

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_uuid_count INTEGER;
  v_orphan_count INTEGER;
  v_fk_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  -- Count remaining UUID columns
  SELECT COUNT(*) INTO v_uuid_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name LIKE '%family%'
    AND data_type = 'uuid';
  
  -- Count orphans
  SELECT COUNT(*) INTO v_orphan_count
  FROM profiles p
  WHERE p.family_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);
  
  -- Count FK constraints
  SELECT COUNT(*) INTO v_fk_count
  FROM information_schema.table_constraints
  WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public'
    AND constraint_name LIKE '%family%';
  
  -- Count policies on profiles
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'profiles';
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '    MIGRATION VERIFICATION SUMMARY';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. UUID Columns Remaining: %', v_uuid_count;
  IF v_uuid_count = 0 THEN
    RAISE NOTICE '   ✅ All family_id columns converted to TEXT';
  ELSE
    RAISE WARNING '   ❌ % columns still UUID - migration incomplete', v_uuid_count;
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '2. Orphaned Profiles: %', v_orphan_count;
  IF v_orphan_count = 0 THEN
    RAISE NOTICE '   ✅ No orphaned profiles';
  ELSE
    RAISE WARNING '   ❌ % profiles without valid families', v_orphan_count;
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '3. Foreign Key Constraints: %', v_fk_count;
  IF v_fk_count >= 2 THEN
    RAISE NOTICE '   ✅ FK constraints in place';
  ELSE
    RAISE WARNING '   ⚠️ Expected at least 2 FK constraints, found %', v_fk_count;
  END IF;
  RAISE NOTICE '';
  RAISE NOTICE '4. Profiles Policies: %', v_policy_count;
  IF v_policy_count >= 1 THEN
    RAISE NOTICE '   ✅ RLS policies active';
  ELSE
    RAISE WARNING '   ❌ No policies on profiles table!';
  END IF;
  RAISE NOTICE '';
  
  IF v_uuid_count = 0 AND v_orphan_count = 0 AND v_fk_count >= 2 AND v_policy_count >= 1 THEN
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ MIGRATION SUCCESSFUL!';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test with real users (family 32af85db...)';
    RAISE NOTICE '2. Have users complete tasks → verify no 409 errors';
    RAISE NOTICE '3. Test new parent registration';
    RAISE NOTICE '4. Test new child registration';
    RAISE NOTICE '5. Monitor Supabase logs for errors';
  ELSE
    RAISE NOTICE '====================================';
    RAISE NOTICE '⚠️ MIGRATION INCOMPLETE';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Review the checks above and fix issues.';
  END IF;
END $$;
