-- ============================================================================
-- SAFE DELETE: kometsinkanyezi@gmail.com user and family
-- ============================================================================
-- Deletes user, family, and all related data in correct order
-- User ID: bd1bb7db-f19b-4d16-b61f-42632d414f2e
-- Family ID: 3c2388ee-148a-4b3c-9a2e-f56236826946
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';
  v_family_id UUID := '3c2388ee-148a-4b3c-9a2e-f56236826946';
  v_email TEXT := 'kometsinkanyezi@gmail.com';
  v_child_count INTEGER;
  v_task_count INTEGER;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'DELETING USER: %', v_email;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Family ID: %', v_family_id;
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  -- Check for children in this family
  SELECT COUNT(*) INTO v_child_count
  FROM profiles
  WHERE family_id = v_family_id
    AND id != v_user_id;
  
  RAISE NOTICE 'Found % other member(s) in family', v_child_count;
  
  -- Check for tasks
  SELECT COUNT(*) INTO v_task_count
  FROM tasks
  WHERE family_id::text = v_family_id::text;
  
  RAISE NOTICE 'Found % task(s) in family', v_task_count;
  RAISE NOTICE '';
  
  -- STEP 1: Delete tasks for this family
  IF v_task_count > 0 THEN
    DELETE FROM tasks WHERE family_id::text = v_family_id::text;
    RAISE NOTICE '✅ Deleted % tasks', v_task_count;
  END IF;
  
  -- STEP 2: Delete notifications for this user
  DELETE FROM notifications WHERE user_id = v_user_id;
  RAISE NOTICE '✅ Deleted notifications for user';
  
  -- STEP 3: Delete rewards/redemptions if they exist
  BEGIN
    DELETE FROM reward_redemptions WHERE user_id = v_user_id;
    RAISE NOTICE '✅ Deleted reward redemptions';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  No reward_redemptions table or no records';
  END;
  
  BEGIN
    DELETE FROM rewards WHERE family_id::text = v_family_id::text;
    RAISE NOTICE '✅ Deleted rewards';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  No rewards table or no records';
  END;
  
  -- STEP 4: Delete bulletin messages if they exist
  BEGIN
    DELETE FROM bulletin_messages WHERE family_id::text = v_family_id::text;
    RAISE NOTICE '✅ Deleted bulletin messages';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  No bulletin_messages table or no records';
  END;
  
  -- STEP 5: Delete activity feed if exists
  BEGIN
    DELETE FROM activity_feed WHERE family_id = v_family_id::text;
    RAISE NOTICE '✅ Deleted activity feed entries';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠️  No activity_feed table or no records';
  END;
  
  -- STEP 6: Delete other family members (children)
  IF v_child_count > 0 THEN
    DELETE FROM user_profiles WHERE id IN (
      SELECT id FROM profiles WHERE family_id = v_family_id AND id != v_user_id
    );
    DELETE FROM profiles WHERE family_id = v_family_id AND id != v_user_id;
    RAISE NOTICE '✅ Deleted % other family member(s)', v_child_count;
  END IF;
  
  -- STEP 7: Delete user_profiles for the parent
  DELETE FROM user_profiles WHERE id = v_user_id;
  RAISE NOTICE '✅ Deleted user_profiles record';
  
  -- STEP 8: Delete profile for the parent
  DELETE FROM profiles WHERE id = v_user_id;
  RAISE NOTICE '✅ Deleted profiles record';
  
  -- STEP 9: Delete the family
  DELETE FROM families WHERE id = v_family_id::text;
  RAISE NOTICE '✅ Deleted family record';
  
  -- STEP 10: Delete from auth.users (CASCADE should handle remaining dependencies)
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE NOTICE '✅ Deleted auth.users record';
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ SUCCESS: User completely deleted';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now re-register with: %', v_email;
  RAISE NOTICE 'This will test the registration trigger with the fixed code.';
  RAISE NOTICE '';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ DELETION FAILED: %', SQLERRM;
  RAISE WARNING 'SQLSTATE: %', SQLSTATE;
  RAISE WARNING '';
  RAISE WARNING 'The deletion was rolled back. Nothing was deleted.';
END $$;

-- Verify deletion
SELECT 
  'Checking auth.users...' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
    THEN '❌ Still exists in auth.users'
    ELSE '✅ Deleted from auth.users'
  END as status
UNION ALL
SELECT 
  'Checking profiles...',
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
    THEN '❌ Still exists in profiles'
    ELSE '✅ Deleted from profiles'
  END
UNION ALL
SELECT 
  'Checking families...',
  CASE 
    WHEN EXISTS (SELECT 1 FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946')
    THEN '❌ Still exists in families'
    ELSE '✅ Deleted from families'
  END;
