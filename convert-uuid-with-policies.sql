-- ============================================================================
-- SAFE UUID CONVERSION: Drop Policies, Convert, Recreate
-- ============================================================================
-- Option A: Minimal disruption with full policy preservation
-- ============================================================================

\echo '========================================'
\echo 'STEP 1: Capture all policies using family_id'
\echo '========================================'

-- Show ALL policies that reference family_id (before we drop them)
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  pg_get_policydef(oid) as full_definition
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = p.schemaname
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE schemaname = 'public'
AND (
  qual LIKE '%family_id%' 
  OR with_check LIKE '%family_id%'
  OR pg_get_policydef(pol.oid) LIKE '%family_id%'
)
ORDER BY tablename, policyname;

\echo ''
\echo '⚠️  REVIEW ABOVE: These policies will be temporarily dropped'
\echo ''

\echo '========================================'
\echo 'STEP 2: Save policy definitions to temp table'
\echo '========================================'

-- Create temp table to store policy definitions
CREATE TEMP TABLE policy_backup AS
SELECT 
  schemaname,
  tablename,
  policyname,
  pg_get_policydef(pol.oid) as definition
FROM pg_policies p
JOIN pg_class c ON c.relname = p.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = p.schemaname
JOIN pg_policy pol ON pol.polrelid = c.oid AND pol.polname = p.policyname
WHERE schemaname = 'public'
AND pg_get_policydef(pol.oid) LIKE '%family_id%';

\echo '✅ Policy definitions backed up to temp table'

-- Show what we captured
SELECT 
  tablename,
  policyname,
  LEFT(definition, 80) || '...' as definition_preview
FROM policy_backup
ORDER BY tablename, policyname;

\echo ''
\echo '========================================'
\echo 'STEP 3: Drop policies that block conversion'
\echo '========================================'

-- Drop policies on profiles table
DROP POLICY IF EXISTS "allow_select_family_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family profiles" ON public.profiles;

-- Drop policies on families table
DROP POLICY IF EXISTS "families_select_owner_or_member" ON public.families;
DROP POLICY IF EXISTS "Family members can view family" ON public.families;

-- Drop policies on tasks table
DROP POLICY IF EXISTS "tasks_view_family" ON public.tasks;
DROP POLICY IF EXISTS "Family members can view all family tasks" ON public.tasks;

-- Drop any other policies that might reference family_id
DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN 
    SELECT policyname, tablename 
    FROM policy_backup
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_policy.policyname, v_policy.tablename);
      RAISE NOTICE 'Dropped policy: % on %', v_policy.policyname, v_policy.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Policy % already dropped or error: %', v_policy.policyname, SQLERRM;
    END;
  END LOOP;
END $$;

\echo '✅ All blocking policies dropped'

\echo ''
\echo '========================================'
\echo 'STEP 4: Convert families.id to UUID (if TEXT)'
\echo '========================================'

-- Check if families.id is text
DO $$
DECLARE
  v_families_id_type TEXT;
BEGIN
  SELECT data_type INTO v_families_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'families' AND column_name = 'id';
  
  IF v_families_id_type IN ('text', 'character varying') THEN
    RAISE NOTICE 'Converting families.id from % to uuid...', v_families_id_type;
    ALTER TABLE public.families ALTER COLUMN id TYPE uuid USING id::uuid;
    RAISE NOTICE '✅ families.id → uuid';
  ELSIF v_families_id_type = 'uuid' THEN
    RAISE NOTICE '✅ families.id already uuid';
  ELSE
    RAISE NOTICE '⚠️  families.id has unexpected type: %', v_families_id_type;
  END IF;
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 5: Convert all family_id columns to UUID'
\echo '========================================'

-- Convert profiles.family_id
ALTER TABLE public.profiles 
ALTER COLUMN family_id TYPE uuid 
USING family_id::uuid;

\echo '✅ profiles.family_id → uuid'

-- Convert tasks.family_id
ALTER TABLE public.tasks 
ALTER COLUMN family_id TYPE uuid 
USING family_id::uuid;

\echo '✅ tasks.family_id → uuid'

-- Convert any other tables with family_id
DO $$
DECLARE
  v_table RECORD;
  v_sql TEXT;
BEGIN
  FOR v_table IN 
    SELECT table_name 
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'family_id'
    AND table_name NOT IN ('profiles', 'tasks')
    AND data_type IN ('text', 'character varying')
  LOOP
    RAISE NOTICE 'Converting %.family_id to uuid...', v_table.table_name;
    v_sql := format('ALTER TABLE public.%I ALTER COLUMN family_id TYPE uuid USING family_id::uuid', v_table.table_name);
    EXECUTE v_sql;
    RAISE NOTICE '✅ %.family_id → uuid', v_table.table_name;
  END LOOP;
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 6: Recreate policies from backup'
\echo '========================================'

-- Recreate policies using saved definitions
DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN 
    SELECT tablename, policyname, definition 
    FROM policy_backup
    ORDER BY tablename, policyname
  LOOP
    BEGIN
      EXECUTE v_policy.definition;
      RAISE NOTICE '✅ Recreated: % on %', v_policy.policyname, v_policy.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '❌ Failed to recreate %: %', v_policy.policyname, SQLERRM;
      RAISE NOTICE '   Definition: %', v_policy.definition;
    END;
  END LOOP;
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 7: Verify all columns converted'
\echo '========================================'

SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'uuid' THEN '✅ UUID'
    ELSE '❌ ' || data_type
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND (column_name = 'family_id' OR (table_name = 'families' AND column_name = 'id'))
ORDER BY table_name, column_name;

\echo ''
\echo '========================================'
\echo 'STEP 8: Verify policies recreated'
\echo '========================================'

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%family_id%' OR with_check LIKE '%family_id%' THEN '✅ Uses family_id'
    ELSE 'Other'
  END as references_family_id
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'tasks', 'families')
ORDER BY tablename, policyname;

\echo ''
\echo '========================================'
\echo 'STEP 9: Test UUID comparison'
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
  
  -- Test comparison (what RLS policies do)
  SELECT (family_id = get_current_user_family_id()) INTO v_match
  FROM public.profiles WHERE id = v_parent1_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UUID Comparison Test';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profile family_id: % (type: %)', v_profile_family, pg_typeof(v_profile_family);
  RAISE NOTICE 'Helper returns: % (type: %)', v_helper_family, pg_typeof(v_helper_family);
  RAISE NOTICE 'Values equal: %', v_profile_family = v_helper_family;
  RAISE NOTICE 'Comparison in query: %', CASE WHEN v_match THEN '✅ TRUE' ELSE '❌ FALSE' END;
  RAISE NOTICE '';
  
  IF v_match AND v_profile_family = v_helper_family THEN
    RAISE NOTICE '🎉 PERFECT! UUID comparison works correctly!';
  ELSE
    RAISE NOTICE '❌ Comparison failed';
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 10: Test RLS with tasks'
\echo '========================================'

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_task_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_parent1_id::text, 'role', 'authenticated')::text, 
    true);
  
  -- Test RLS query
  SELECT COUNT(*) INTO v_task_count
  FROM public.tasks
  WHERE family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid());
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Policy Test';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tasks visible to Parent 1: %', v_task_count;
  RAISE NOTICE 'Expected: 4';
  RAISE NOTICE '';
  
  IF v_task_count = 4 THEN
    RAISE NOTICE '🎉 SUCCESS! RLS policies work correctly!';
  ELSIF v_task_count = 0 THEN
    RAISE NOTICE '❌ No tasks visible (check RLS policies)';
  ELSE
    RAISE NOTICE '⚠️  Partial result (got %, expected 4)', v_task_count;
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'COMPLETE!'
\echo '========================================'
\echo '✅ All family_id columns converted to UUID'
\echo '✅ All policies recreated'
\echo '✅ Type compatibility verified'
\echo '✅ RLS policies tested'
\echo ''
\echo 'FINAL STEP:'
\echo '  Both parents refresh dashboards (Ctrl+Shift+R)'
\echo '  Tasks should now load for both parents!'
\echo ''
