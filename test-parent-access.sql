-- ============================================================================
-- TEST PARENT ACCESS: Simulate each parent's JWT to test RLS
-- ============================================================================
-- Tests what each parent can see through RLS policies
-- ============================================================================

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3'; -- kometsinkanyezi
  v_parent2_id UUID := 'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3'; -- nkazimulokometsi
  v_family_id UUID := 'a81f29d9-498b-48f8-a164-e933cab30316';
  v_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST ACCESS FOR PARENT 1 (kometsinkanyezi)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_parent1_id;
  RAISE NOTICE '';
  
  -- Simulate Parent 1's session
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_parent1_id::text,
      'role', 'authenticated',
      'email', 'kometsinkanyezi@gmail.com'
    )::text, 
    true);
  
  -- Test: Can Parent 1 see tasks?
  SELECT COUNT(*) INTO v_count
  FROM public.tasks
  WHERE family_id = v_family_id;
  
  RAISE NOTICE 'Tasks visible to Parent 1: %', v_count;
  
  IF v_count = 0 THEN
    RAISE NOTICE '❌ BLOCKED: Parent 1 cannot see any tasks!';
  ELSE
    RAISE NOTICE '✅ SUCCESS: Parent 1 can see tasks';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST ACCESS FOR PARENT 2 (nkazimulokometsi)';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'User ID: %', v_parent2_id;
  RAISE NOTICE '';
  
  -- Simulate Parent 2's session
  PERFORM set_config('request.jwt.claims', 
    json_build_object(
      'sub', v_parent2_id::text,
      'role', 'authenticated',
      'email', 'nkazimulokometsi@gmail.com'
    )::text, 
    true);
  
  -- Test: Can Parent 2 see tasks?
  SELECT COUNT(*) INTO v_count
  FROM public.tasks
  WHERE family_id = v_family_id;
  
  RAISE NOTICE 'Tasks visible to Parent 2: %', v_count;
  
  IF v_count = 0 THEN
    RAISE NOTICE '❌ BLOCKED: Parent 2 cannot see any tasks!';
  ELSE
    RAISE NOTICE '✅ SUCCESS: Parent 2 can see tasks';
  END IF;
  
  -- Reset
  PERFORM set_config('request.jwt.claims', NULL, true);
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'EXPECTED RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Both parents should see 4 tasks.';
  RAISE NOTICE 'If either shows 0, RLS policies are blocking access.';
  RAISE NOTICE '';
END $$;

-- Show raw data without RLS (using superuser context)
\echo '========================================'
\echo 'RAW DATA (without RLS filters)'
\echo '========================================'

SELECT 
  t.title,
  t.family_id,
  p_creator.email as creator_email,
  p_creator.id as creator_id,
  p_assigned.email as assigned_email,
  t.completed,
  t.approved
FROM public.tasks t
LEFT JOIN public.profiles p_creator ON t.created_by = p_creator.id
LEFT JOIN public.profiles p_assigned ON t.assigned_to = p_assigned.id
WHERE t.family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'
ORDER BY t.created_at DESC;
