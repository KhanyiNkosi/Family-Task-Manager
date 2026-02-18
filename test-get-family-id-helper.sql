-- ============================================================================
-- TEST get_current_user_family_id() HELPER FUNCTION
-- ============================================================================
-- Tests if the helper function returns correct family_id for each parent
-- ============================================================================

\echo '========================================'
\echo 'CHECK get_current_user_family_id() FUNCTION'
\echo '========================================'

-- First, show the function definition
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'get_current_user_family_id';

\echo ''
\echo '========================================'
\echo 'TEST FOR PARENT 1 (kometsinkanyezi)'
\echo '========================================'

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_expected_family UUID := 'a81f29d9-498b-48f8-a164-e933cab30316';
  v_returned_family UUID;
BEGIN
  -- Simulate Parent 1's JWT
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_parent1_id::text,
      'role', 'authenticated',
      'email', 'kometsinkanyezi@gmail.com'
    )::text, 
    true);
  
  -- Test the helper function
  SELECT get_current_user_family_id() INTO v_returned_family;
  
  RAISE NOTICE 'Parent 1 ID: %', v_parent1_id;
  RAISE NOTICE 'Expected family_id: %', v_expected_family;
  RAISE NOTICE 'Returned family_id: %', COALESCE(v_returned_family::text, 'NULL');
  
  IF v_returned_family = v_expected_family THEN
    RAISE NOTICE '✅ CORRECT: Helper returns correct family_id';
  ELSIF v_returned_family IS NULL THEN
    RAISE NOTICE '❌ ERROR: Helper returns NULL (function may be broken)';
  ELSE
    RAISE NOTICE '❌ ERROR: Helper returns wrong family_id';
  END IF;
  
  -- Reset
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'TEST FOR PARENT 2 (nkazimulokometsi)'
\echo '========================================'

DO $$
DECLARE
  v_parent2_id UUID := 'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3';
  v_expected_family UUID := 'a81f29d9-498b-48f8-a164-e933cab30316';
  v_returned_family UUID;
BEGIN
  -- Simulate Parent 2's JWT
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_parent2_id::text,
      'role', 'authenticated',
      'email', 'nkazimulokometsi@gmail.com'
    )::text, 
    true);
  
  -- Test the helper function
  SELECT get_current_user_family_id() INTO v_returned_family;
  
  RAISE NOTICE 'Parent 2 ID: %', v_parent2_id;
  RAISE NOTICE 'Expected family_id: %', v_expected_family;
  RAISE NOTICE 'Returned family_id: %', COALESCE(v_returned_family::text, 'NULL');
  
  IF v_returned_family = v_expected_family THEN
    RAISE NOTICE '✅ CORRECT: Helper returns correct family_id';
  ELSIF v_returned_family IS NULL THEN
    RAISE NOTICE '❌ ERROR: Helper returns NULL (function may be broken)';
  ELSE
    RAISE NOTICE '❌ ERROR: Helper returns wrong family_id';
  END IF;
  
  -- Reset
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'DIRECT PROFILE LOOKUP (bypass helper)'
\echo '========================================'

-- Test direct lookup without helper function
DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_parent2_id UUID := 'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3';
  v_family1 UUID;
  v_family2 UUID;
BEGIN
  -- Direct lookup (what the helper should do)
  SELECT family_id INTO v_family1 FROM public.profiles WHERE id = v_parent1_id;
  SELECT family_id INTO v_family2 FROM public.profiles WHERE id = v_parent2_id;
  
  RAISE NOTICE 'Parent 1 family_id (direct lookup): %', v_family1;
  RAISE NOTICE 'Parent 2 family_id (direct lookup): %', v_family2;
  
  IF v_family1 = v_family2 THEN
    RAISE NOTICE '✅ Both parents have same family_id in database';
  ELSE
    RAISE NOTICE '❌ Parents have DIFFERENT family_ids!';
  END IF;
END $$;

\echo ''
\echo '========================================'
\echo 'ANALYSIS'
\echo '========================================'
\echo 'If helper returns NULL: Function is broken, needs fixing'
\echo 'If helper returns wrong value: Function logic is incorrect'
\echo 'If helper returns correct value: Issue is in frontend or JWT'
\echo ''
