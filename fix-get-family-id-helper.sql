-- ============================================================================
-- FIX get_current_user_family_id() HELPER FUNCTION
-- ============================================================================
-- Fixes type mismatch (text → uuid) and uses safe auth.uid() pattern
-- ============================================================================

\echo '========================================'
\echo 'CURRENT FUNCTION (before fix)'
\echo '========================================'

-- Show current definition
SELECT pg_get_functiondef(oid) as current_definition
FROM pg_proc
WHERE proname = 'get_current_user_family_id';

\echo ''
\echo '========================================'
\echo 'APPLYING FIX'
\echo '========================================'

-- Replace with corrected version
CREATE OR REPLACE FUNCTION public.get_current_user_family_id()
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

\echo '✅ Function replaced with uuid return type and safe auth.uid() usage'

-- Grant execute to authenticated users (revoke from anon for security)
REVOKE EXECUTE ON FUNCTION public.get_current_user_family_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_family_id() TO authenticated;

\echo '✅ Permissions set: authenticated users only'

\echo ''
\echo '========================================'
\echo 'VERIFICATION'
\echo '========================================'

-- Show new definition
SELECT 
  proname as function_name,
  pg_get_function_result(oid) as return_type,
  prosecdef as is_security_definer,
  provolatile as volatility
FROM pg_proc
WHERE proname = 'get_current_user_family_id';

\echo ''
\echo '========================================'
\echo 'TEST WITH PARENT 1'
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
  
  RAISE NOTICE 'Parent 1 test:';
  RAISE NOTICE '  Expected: %', v_expected_family;
  RAISE NOTICE '  Returned: %', COALESCE(v_returned_family::text, 'NULL');
  RAISE NOTICE '  Match: %', (v_returned_family = v_expected_family);
  
  IF v_returned_family = v_expected_family THEN
    RAISE NOTICE '  ✅ SUCCESS';
  ELSE
    RAISE NOTICE '  ❌ FAILED';
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'TEST WITH PARENT 2'
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
  
  RAISE NOTICE 'Parent 2 test:';
  RAISE NOTICE '  Expected: %', v_expected_family;
  RAISE NOTICE '  Returned: %', COALESCE(v_returned_family::text, 'NULL');
  RAISE NOTICE '  Match: %', (v_returned_family = v_expected_family);
  
  IF v_returned_family = v_expected_family THEN
    RAISE NOTICE '  ✅ SUCCESS';
  ELSE
    RAISE NOTICE '  ❌ FAILED';
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'NEXT STEP'
\echo '========================================'
\echo 'Now run: test-actual-rls-access.sql'
\echo 'This will verify RLS policies work with the fixed function'
\echo ''
