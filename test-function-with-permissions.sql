-- ============================================================================
-- TEST get_current_user_family_id() with Temporary Permissions
-- ============================================================================
-- Grants PUBLIC temporarily, runs tests, then revokes to restore security
-- ============================================================================

\echo '========================================'
\echo 'STEP 1: Grant temporary PUBLIC access for testing'
\echo '========================================'

-- Temporarily grant PUBLIC so DO blocks can call the function
GRANT EXECUTE ON FUNCTION public.get_current_user_family_id() TO PUBLIC;

\echo '✅ Temporarily granted PUBLIC execute (for testing only)'

\echo ''
\echo '========================================'
\echo 'STEP 2: Verify function signature'
\echo '========================================'

SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  prosecdef as security_definer,
  CASE provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility
FROM pg_proc
WHERE proname = 'get_current_user_family_id';

\echo ''
\echo '========================================'
\echo 'STEP 3: Test Parent 1 (kometsinkanyezi)'
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
  
  -- Test the function
  SELECT get_current_user_family_id() INTO v_returned_family;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Parent 1: kometsinkanyezi@gmail.com';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_parent1_id;
  RAISE NOTICE 'Expected: %', v_expected_family;
  RAISE NOTICE 'Returned: %', COALESCE(v_returned_family::text, 'NULL');
  RAISE NOTICE 'Return type: uuid (no casting needed)';
  RAISE NOTICE '';
  
  IF v_returned_family = v_expected_family THEN
    RAISE NOTICE '✅ SUCCESS: Function returns correct family_id!';
  ELSIF v_returned_family IS NULL THEN
    RAISE NOTICE '❌ FAILED: Function returned NULL';
    RAISE NOTICE '   (Check if profile exists or auth.uid() is working)';
  ELSE
    RAISE NOTICE '❌ FAILED: Function returned wrong family_id';
    RAISE NOTICE '   Got: %', v_returned_family;
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 4: Test Parent 2 (nkazimulokometsi)'
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
  
  -- Test the function
  SELECT get_current_user_family_id() INTO v_returned_family;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Parent 2: nkazimulokometsi@gmail.com';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_parent2_id;
  RAISE NOTICE 'Expected: %', v_expected_family;
  RAISE NOTICE 'Returned: %', COALESCE(v_returned_family::text, 'NULL');
  RAISE NOTICE 'Return type: uuid (no casting needed)';
  RAISE NOTICE '';
  
  IF v_returned_family = v_expected_family THEN
    RAISE NOTICE '✅ SUCCESS: Function returns correct family_id!';
  ELSIF v_returned_family IS NULL THEN
    RAISE NOTICE '❌ FAILED: Function returned NULL';
    RAISE NOTICE '   (Check if profile exists or auth.uid() is working)';
  ELSE
    RAISE NOTICE '❌ FAILED: Function returned wrong family_id';
    RAISE NOTICE '   Got: %', v_returned_family;
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 5: Test type compatibility in RLS context'
\echo '========================================'

-- Verify uuid=uuid comparison works (this is what RLS policies do)
DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_test_family UUID;
  v_comparison_works BOOLEAN;
BEGIN
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_parent1_id::text, 'role', 'authenticated')::text, 
    true);
  
  -- Simulate RLS policy comparison: family_id = get_current_user_family_id()
  SELECT 
    (family_id = get_current_user_family_id()) INTO v_comparison_works
  FROM public.profiles
  WHERE id = v_parent1_id;
  
  RAISE NOTICE 'UUID comparison test (simulating RLS):';
  RAISE NOTICE '  profile.family_id = get_current_user_family_id()';
  RAISE NOTICE '  Result: %', CASE WHEN v_comparison_works THEN '✅ TRUE (types match!)' ELSE '❌ FALSE' END;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 6: REVOKE PUBLIC access (restore security)'
\echo '========================================'

-- Remove PUBLIC access, keep only authenticated
REVOKE EXECUTE ON FUNCTION public.get_current_user_family_id() FROM PUBLIC;

\echo '✅ Revoked PUBLIC execute'

-- Verify final permissions
SELECT 
  'authenticated'::text as role,
  has_function_privilege('authenticated', 'public.get_current_user_family_id()', 'EXECUTE') as can_execute
UNION ALL
SELECT 
  'anon'::text,
  has_function_privilege('anon', 'public.get_current_user_family_id()', 'EXECUTE')
UNION ALL
SELECT 
  'public'::text,
  has_function_privilege('public', 'public.get_current_user_family_id()', 'EXECUTE');

\echo ''
\echo '========================================'
\echo 'STEP 7: Verify RLS policies still work'
\echo '========================================'

-- Check policies that use the function
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%get_current_user_family_id%' THEN '✅ Uses helper'
    ELSE 'No'
  END as uses_helper
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'profiles')
AND (qual LIKE '%family_id%' OR qual LIKE '%get_current%')
ORDER BY tablename, policyname;

\echo ''
\echo '========================================'
\echo 'SUMMARY'
\echo '========================================'
\echo 'If both parents show ✅ SUCCESS:'
\echo '  → Function works correctly with uuid return type'
\echo '  → Type mismatch is FIXED (uuid = uuid comparisons work)'
\echo '  → RLS policies can now properly match family_id'
\echo ''
\echo 'Next steps:'
\echo '  1. Run: test-actual-rls-access.sql (verify RLS grants access)'
\echo '  2. Both parents refresh dashboards (Ctrl+Shift+R)'
\echo '  3. Tasks should load for both parents!'
\echo ''
