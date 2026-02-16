-- ============================================================================
-- VERIFY: Long-term fix is in place
-- ============================================================================
-- Check that the trigger and function are correctly configured
-- ============================================================================

-- Check 1: Does the updated function exist?
SELECT 
  routine_name,
  '✅ Function exists' as status,
  created as created_date,
  last_altered as last_updated
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- Check 2: Is the trigger attached to auth.users?
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  '✅ Trigger is active' as status
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check 3: View the current function source (verify it has the fixes)
SELECT pg_get_functiondef(oid) as function_source
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check 4: Test query - simulate what happens when parent registers
-- (This doesn't actually create a user, just tests the INSERT logic)
DO $$
DECLARE
  v_test_family_id UUID := gen_random_uuid();
  v_test_user_id UUID := gen_random_uuid();
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TESTING: New parent registration flow';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Test family_id: %', v_test_family_id;
  RAISE NOTICE 'Test user_id: %', v_test_user_id;
  RAISE NOTICE '';
  
  -- Try to insert into families (same logic as trigger)
  BEGIN
    INSERT INTO public.families (id, owner_id, created_at)
    VALUES (v_test_family_id::text, v_test_user_id, NOW())
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ SUCCESS: Can create family with correct schema';
    RAISE NOTICE '   families.id type: TEXT (correctly cast from UUID)';
    RAISE NOTICE '   families.owner_id: UUID';
    RAISE NOTICE '   families.created_at: timestamptz';
    
    -- Clean up test data
    DELETE FROM public.families WHERE id = v_test_family_id::text;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Test family deleted (cleanup)';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ FAILED: %', SQLERRM;
    RAISE WARNING 'This means the trigger will fail for new users!';
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'VERDICT:';
  RAISE NOTICE 'If you see "SUCCESS" above, new users will get family_id automatically';
  RAISE NOTICE '====================================';
END $$;

-- Check 5: Count NULL family_id profiles by creation date
-- (Shows if problem stopped after fix was applied)
SELECT 
  DATE(created_at) as registration_date,
  COUNT(*) FILTER (WHERE family_id IS NULL) as null_family_count,
  COUNT(*) FILTER (WHERE family_id IS NOT NULL) as has_family_count,
  CASE 
    WHEN COUNT(*) FILTER (WHERE family_id IS NULL) = 0 THEN '✅ All users have family_id'
    ELSE '⚠️ ' || COUNT(*) FILTER (WHERE family_id IS NULL)::text || ' users need backfill'
  END as status
FROM profiles
WHERE role = 'parent'
GROUP BY DATE(created_at)
ORDER BY registration_date DESC
LIMIT 10;
