-- ============================================================================
-- TEST ACTUAL RLS ACCESS: Simulate Real User Queries
-- ============================================================================
-- Simulates exactly what happens when each parent queries tasks
-- Tests all three SELECT policies and shows which ones grant access
-- ============================================================================

\echo '========================================'
\echo 'TEST RLS ACCESS FOR PARENT 1 (kometsinkanyezi)'
\echo 'User ID: d86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3'
\echo '========================================'

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_expected_family UUID := 'a81f29d9-498b-48f8-a164-e933cab30316';
  v_count INTEGER;
  v_helper_family UUID;
BEGIN
  -- Set JWT claims
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_parent1_id::text,
      'role', 'authenticated',
      'email', 'kometsinkanyezi@gmail.com'
    )::text, 
    true);
  
  -- Test 1: What does auth.uid() return?
  RAISE NOTICE '';
  RAISE NOTICE '1. Testing auth.uid()...';
  RAISE NOTICE '   Expected: %', v_parent1_id;
  RAISE NOTICE '   Actual: %', COALESCE(auth.uid()::text, 'NULL');
  
  IF auth.uid() = v_parent1_id THEN
    RAISE NOTICE '   ✅ auth.uid() works correctly';
  ELSE
    RAISE NOTICE '   ❌ auth.uid() is wrong or NULL!';
  END IF;
  
  -- Test 2: What does helper function return?
  RAISE NOTICE '';
  RAISE NOTICE '2. Testing get_current_user_family_id()...';
  SELECT get_current_user_family_id() INTO v_helper_family;
  RAISE NOTICE '   Expected: %', v_expected_family;
  RAISE NOTICE '   Actual: %', COALESCE(v_helper_family::text, 'NULL');
  
  IF v_helper_family = v_expected_family THEN
    RAISE NOTICE '   ✅ Helper function works correctly';
  ELSE
    RAISE NOTICE '   ❌ Helper function returns wrong value!';
  END IF;
  
  -- Test 3: How many tasks visible via tasks_view_assigned?
  RAISE NOTICE '';
  RAISE NOTICE '3. Testing tasks_view_assigned policy (assigned_to = auth.uid())...';
  SELECT COUNT(*) INTO v_count
  FROM public.tasks
  WHERE assigned_to = auth.uid();
  RAISE NOTICE '   Tasks visible: %', v_count;
  
  -- Test 4: How many tasks visible via tasks_view_created?
  RAISE NOTICE '';
  RAISE NOTICE '4. Testing tasks_view_created policy (created_by = auth.uid())...';
  SELECT COUNT(*) INTO v_count
  FROM public.tasks
  WHERE created_by = auth.uid();
  RAISE NOTICE '   Tasks visible: %', v_count;
  
  -- Test 5: How many tasks visible via tasks_view_family?
  RAISE NOTICE '';
  RAISE NOTICE '5. Testing tasks_view_family policy (family_id match)...';
  SELECT COUNT(*) INTO v_count
  FROM public.tasks
  WHERE family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid());
  RAISE NOTICE '   Tasks visible: %', v_count;
  
  -- Test 6: Total tasks visible (RLS applied)
  RAISE NOTICE '';
  RAISE NOTICE '6. Testing TOTAL tasks visible (all RLS policies combined)...';
  SELECT COUNT(*) INTO v_count FROM public.tasks;
  RAISE NOTICE '   Total tasks visible: %', v_count;
  RAISE NOTICE '   Expected: 4';
  
  IF v_count = 4 THEN
    RAISE NOTICE '   ✅ SUCCESS: Parent 1 can see all family tasks!';
  ELSIF v_count = 0 THEN
    RAISE NOTICE '   ❌ BLOCKED: Parent 1 cannot see ANY tasks!';
  ELSE
    RAISE NOTICE '   ⚠️  PARTIAL: Parent 1 sees only % of 4 tasks', v_count;
  END IF;
  
  -- Reset
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'TEST RLS ACCESS FOR PARENT 2 (nkazimulokometsi)'
\echo 'User ID: d8d0524f-fe0c-40ed-912b-9f1c17e8b5a3'
\echo '========================================'

DO $$
DECLARE
  v_parent2_id UUID := 'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3';
  v_expected_family UUID := 'a81f29d9-498b-48f8-a164-e933cab30316';
  v_count INTEGER;
  v_helper_family UUID;
BEGIN
  -- Set JWT claims
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_parent2_id::text,
      'role', 'authenticated',
      'email', 'nkazimulokometsi@gmail.com'
    )::text, 
    true);
  
  -- Test 1: What does auth.uid() return?
  RAISE NOTICE '';
  RAISE NOTICE '1. Testing auth.uid()...';
  RAISE NOTICE '   Expected: %', v_parent2_id;
  RAISE NOTICE '   Actual: %', COALESCE(auth.uid()::text, 'NULL');
  
  IF auth.uid() = v_parent2_id THEN
    RAISE NOTICE '   ✅ auth.uid() works correctly';
  ELSE
    RAISE NOTICE '   ❌ auth.uid() is wrong or NULL!';
  END IF;
  
  -- Test 2: What does helper function return?
  RAISE NOTICE '';
  RAISE NOTICE '2. Testing get_current_user_family_id()...';
  SELECT get_current_user_family_id() INTO v_helper_family;
  RAISE NOTICE '   Expected: %', v_expected_family;
  RAISE NOTICE '   Actual: %', COALESCE(v_helper_family::text, 'NULL');
  
  IF v_helper_family = v_expected_family THEN
    RAISE NOTICE '   ✅ Helper function works correctly';
  ELSE
    RAISE NOTICE '   ❌ Helper function returns wrong value!';
  END IF;
  
  -- Test 3: How many tasks visible via tasks_view_assigned?
  RAISE NOTICE '';
  RAISE NOTICE '3. Testing tasks_view_assigned policy (assigned_to = auth.uid())...';
  SELECT COUNT(*) INTO v_count
  FROM public.tasks
  WHERE assigned_to = auth.uid();
  RAISE NOTICE '   Tasks visible: %', v_count;
  
  -- Test 4: How many tasks visible via tasks_view_created?
  RAISE NOTICE '';
  RAISE NOTICE '4. Testing tasks_view_created policy (created_by = auth.uid())...';
  SELECT COUNT(*) INTO v_count
  FROM public.tasks
  WHERE created_by = auth.uid();
  RAISE NOTICE '   Tasks visible: %', v_count;
  
  -- Test 5: How many tasks visible via tasks_view_family?
  RAISE NOTICE '';
  RAISE NOTICE '5. Testing tasks_view_family policy (family_id match)...';
  SELECT COUNT(*) INTO v_count
  FROM public.tasks
  WHERE family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid());
  RAISE NOTICE '   Tasks visible: %', v_count;
  
  -- Test 6: Total tasks visible (RLS applied)
  RAISE NOTICE '';
  RAISE NOTICE '6. Testing TOTAL tasks visible (all RLS policies combined)...';
  SELECT COUNT(*) INTO v_count FROM public.tasks;
  RAISE NOTICE '   Total tasks visible: %', v_count;
  RAISE NOTICE '   Expected: 4';
  
  IF v_count = 4 THEN
    RAISE NOTICE '   ✅ SUCCESS: Parent 2 can see all family tasks!';
  ELSIF v_count = 0 THEN
    RAISE NOTICE '   ❌ BLOCKED: Parent 2 cannot see ANY tasks!';
  ELSE
    RAISE NOTICE '   ⚠️  PARTIAL: Parent 2 sees only % of 4 tasks', v_count;
  END IF;
  
  -- Reset
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'SUMMARY & DIAGNOSIS'
\echo '========================================'
\echo ''
\echo 'If both parents see 4 tasks:'
\echo '  ➜ RLS works! Issue is in frontend query or JWT on client'
\echo ''
\echo 'If one parent sees 0 tasks:'
\echo '  ➜ Check which tests failed for that parent'
\echo '  ➜ If auth.uid() is NULL: JWT not set properly'
\echo '  ➜ If helper returns NULL: Helper function broken'
\echo '  ➜ If family_id query returns 0: Profile data issue'
\echo ''
\echo 'If both see 0 tasks:'
\echo '  ➜ RLS policies may be too restrictive'
\echo '  ➜ Or all tasks fail family_id/assignment/creator checks'
\echo ''
