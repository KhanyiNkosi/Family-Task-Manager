-- ============================================================================
-- FIX get_current_user_family_id() - Drop and Recreate with UUID
-- ============================================================================
-- Option B: Drop existing function and recreate with correct signature
-- ============================================================================

\echo '========================================'
\echo 'STEP 1: Show current function'
\echo '========================================'

SELECT 
  proname as function_name,
  pg_get_function_result(oid) as current_return_type,
  prosecdef as is_security_definer
FROM pg_proc
WHERE proname = 'get_current_user_family_id';

\echo ''
\echo '========================================'
\echo 'STEP 2: Drop existing function'
\echo '========================================'

-- Drop function (policies will temporarily not work, then auto-reconnect)
DROP FUNCTION IF EXISTS public.get_current_user_family_id() CASCADE;

\echo '✅ Old function dropped'

\echo ''
\echo '========================================'
\echo 'STEP 3: Create corrected function'
\echo '========================================'

-- Create with correct signature: RETURNS uuid, uses (SELECT auth.uid())
CREATE FUNCTION public.get_current_user_family_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_family_id uuid;
BEGIN
  -- Use (SELECT auth.uid()) for stable RLS context
  -- Return uuid (not text) to avoid casting issues in policies
  SELECT family_id INTO v_family_id
  FROM public.profiles
  WHERE id = (SELECT auth.uid());
  
  RETURN v_family_id;
END;
$$;

\echo '✅ Function recreated with uuid return type and safe auth.uid() pattern'

\echo ''
\echo '========================================'
\echo 'STEP 4: Set permissions'
\echo '========================================'

-- Grant execute to authenticated users only (block anon for security)
REVOKE EXECUTE ON FUNCTION public.get_current_user_family_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_user_family_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_family_id() TO authenticated;

\echo '✅ Permissions: authenticated only'

\echo ''
\echo '========================================'
\echo 'STEP 5: Verify new function'
\echo '========================================'

SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  prosecdef as security_definer,
  provolatile as volatility,
  CASE provolatile
    WHEN 'i' THEN 'IMMUTABLE'
    WHEN 's' THEN 'STABLE'
    WHEN 'v' THEN 'VOLATILE'
  END as volatility_label
FROM pg_proc
WHERE proname = 'get_current_user_family_id';

\echo ''
\echo '========================================'
\echo 'STEP 6: Test with Parent 1 (kometsinkanyezi)'
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
  
  -- Test the fixed function
  SELECT get_current_user_family_id() INTO v_returned_family;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Parent 1 (kometsinkanyezi)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_parent1_id;
  RAISE NOTICE 'Expected family_id: %', v_expected_family;
  RAISE NOTICE 'Returned family_id: %', COALESCE(v_returned_family::text, 'NULL');
  RAISE NOTICE 'Types match (uuid=uuid): YES';
  
  IF v_returned_family = v_expected_family THEN
    RAISE NOTICE 'Result: ✅ SUCCESS - Function works correctly!';
  ELSIF v_returned_family IS NULL THEN
    RAISE NOTICE 'Result: ❌ FAILED - Function returned NULL';
  ELSE
    RAISE NOTICE 'Result: ❌ FAILED - Wrong family_id returned';
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 7: Test with Parent 2 (nkazimulokometsi)'
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
  
  -- Test the fixed function
  SELECT get_current_user_family_id() INTO v_returned_family;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Parent 2 (nkazimulokometsi)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_parent2_id;
  RAISE NOTICE 'Expected family_id: %', v_expected_family;
  RAISE NOTICE 'Returned family_id: %', COALESCE(v_returned_family::text, 'NULL');
  RAISE NOTICE 'Types match (uuid=uuid): YES';
  
  IF v_returned_family = v_expected_family THEN
    RAISE NOTICE 'Result: ✅ SUCCESS - Function works correctly!';
  ELSIF v_returned_family IS NULL THEN
    RAISE NOTICE 'Result: ❌ FAILED - Function returned NULL';
  ELSE
    RAISE NOTICE 'Result: ❌ FAILED - Wrong family_id returned';
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 8: Verify RLS policies still exist'
\echo '========================================'

-- Check that policies using the function are still active
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%get_current_user_family_id%' THEN '✅ Uses helper function'
    ELSE 'No'
  END as uses_helper
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'tasks'
AND qual LIKE '%family_id%'
ORDER BY policyname;

\echo ''
\echo '========================================'
\echo 'COMPLETE! Next Steps:'
\echo '========================================'
\echo '1. If both parent tests show ✅ SUCCESS, the fix worked!'
\echo '2. Run: test-actual-rls-access.sql to verify RLS allows access'
\echo '3. Have both parents refresh their dashboards'
\echo '4. Tasks should now load for both parents!'
\echo ''
