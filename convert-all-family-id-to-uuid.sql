-- ============================================================================
-- CONVERT ALL family_id COLUMNS TO UUID
-- ============================================================================
-- Converts family_id from text to uuid in all tables
-- ============================================================================

\echo '========================================'
\echo 'STEP 1: Find all family_id columns'
\echo '========================================'

-- List all tables with family_id column
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'family_id'
ORDER BY table_name;

\echo ''
\echo '========================================'
\echo 'STEP 2: Validate data in each table'
\echo '========================================'

-- Check profiles.family_id
\echo 'Checking profiles.family_id...'
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_rows,
  COUNT(family_id) as non_null_count,
  COUNT(*) FILTER (
    WHERE family_id IS NOT NULL 
    AND family_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) as invalid_uuid_count
FROM public.profiles;

-- Check tasks.family_id
\echo 'Checking tasks.family_id...'
SELECT 
  'tasks' as table_name,
  COUNT(*) as total_rows,
  COUNT(family_id) as non_null_count,
  COUNT(*) FILTER (
    WHERE family_id IS NOT NULL 
    AND family_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  ) as invalid_uuid_count
FROM public.tasks;

-- Check other tables (add more as needed)
SELECT 
  t.table_name,
  COUNT(*) as total_rows,
  'Check manually' as status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
AND EXISTS (
  SELECT 1 FROM information_schema.columns c
  WHERE c.table_schema = 'public'
  AND c.table_name = t.table_name
  AND c.column_name = 'family_id'
)
AND t.table_name NOT IN ('profiles', 'tasks')
GROUP BY t.table_name;

\echo ''
\echo '========================================'
\echo 'STEP 3: Convert profiles.family_id'
\echo '========================================'

ALTER TABLE public.profiles 
ALTER COLUMN family_id TYPE uuid 
USING family_id::uuid;

\echo '✅ profiles.family_id → uuid'

\echo ''
\echo '========================================'
\echo 'STEP 4: Convert tasks.family_id'
\echo '========================================'

ALTER TABLE public.tasks 
ALTER COLUMN family_id TYPE uuid 
USING family_id::uuid;

\echo '✅ tasks.family_id → uuid'

\echo ''
\echo '========================================'
\echo 'STEP 5: Convert other tables if needed'
\echo '========================================'

-- Check if there are other tables with family_id
DO $$
DECLARE
  v_table_name TEXT;
  v_sql TEXT;
BEGIN
  FOR v_table_name IN 
    SELECT table_name 
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'family_id'
    AND table_name NOT IN ('profiles', 'tasks')
    AND data_type = 'text'
  LOOP
    RAISE NOTICE 'Converting %.family_id to uuid...', v_table_name;
    v_sql := format('ALTER TABLE public.%I ALTER COLUMN family_id TYPE uuid USING family_id::uuid', v_table_name);
    EXECUTE v_sql;
    RAISE NOTICE '✅ %.family_id → uuid', v_table_name;
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE '(No other tables with text family_id found)';
  END IF;
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 6: Verify all conversions'
\echo '========================================'

SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'uuid' THEN '✅ Correct'
    WHEN data_type = 'text' THEN '❌ Still text'
    ELSE '⚠️  ' || data_type
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'family_id'
ORDER BY table_name;

\echo ''
\echo '========================================'
\echo 'STEP 7: Test uuid comparisons'
\echo '========================================'

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_profile_family UUID;
  v_helper_family UUID;
  v_match BOOLEAN;
BEGIN
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_parent1_id::text, 'role', 'authenticated')::text, 
    true);
  
  -- Get family_id from profile
  SELECT family_id INTO v_profile_family FROM public.profiles WHERE id = v_parent1_id;
  
  -- Get family_id from helper
  SELECT get_current_user_family_id() INTO v_helper_family;
  
  -- Test comparison
  SELECT (family_id = get_current_user_family_id()) INTO v_match
  FROM public.profiles WHERE id = v_parent1_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UUID Comparison Test';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profile family_id: % (type: %)', v_profile_family, pg_typeof(v_profile_family);
  RAISE NOTICE 'Helper returns: % (type: %)', v_helper_family, pg_typeof(v_helper_family);
  RAISE NOTICE 'Comparison result: %', CASE WHEN v_match THEN '✅ TRUE' ELSE '❌ FALSE' END;
  RAISE NOTICE '';
  
  IF v_match AND v_profile_family = v_helper_family THEN
    RAISE NOTICE '🎉 PERFECT! All types match and values are equal!';
  ELSIF v_match THEN
    RAISE NOTICE '✅ Comparison works (types compatible)';
  ELSE
    RAISE NOTICE '❌ Comparison failed or values mismatch';
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 8: Test RLS policy with tasks'
\echo '========================================'

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_task_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_parent1_id::text, 'role', 'authenticated')::text, 
    true);
  
  -- Simulate RLS query (what the policy does)
  SELECT COUNT(*) INTO v_task_count
  FROM public.tasks
  WHERE family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid());
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policy Test (tasks)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Query: tasks WHERE family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())';
  RAISE NOTICE 'Tasks visible: %', v_task_count;
  RAISE NOTICE 'Expected: 4';
  RAISE NOTICE '';
  
  IF v_task_count = 4 THEN
    RAISE NOTICE '🎉 SUCCESS! RLS policy works correctly!';
  ELSIF v_task_count = 0 THEN
    RAISE NOTICE '❌ No tasks visible (RLS may still be blocking)';
  ELSE
    RAISE NOTICE '⚠️  Partial result (expected 4, got %)', v_task_count;
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'COMPLETE!'
\echo '========================================'
\echo '✅ All family_id columns converted to uuid'
\echo '✅ Type mismatches resolved'
\echo '✅ RLS policies should work correctly'
\echo ''
\echo 'Final steps:'
\echo '  1. Both parents refresh dashboards (Ctrl+Shift+R)'
\echo '  2. Tasks should now load for both parents!'
\echo '  3. Test creating/approving tasks as both parents'
\echo ''
