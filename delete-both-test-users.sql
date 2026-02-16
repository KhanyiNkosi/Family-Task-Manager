-- ============================================================================
-- DELETE BOTH TEST USERS - Clean slate for testing
-- ============================================================================
-- User 1: kometsinkanyezi@gmail.com (bd1bb7db-f19b-4d16-b61f-42632d414f2e)
-- User 2: nkazimulokometsi@gmail.com (a86f3d4b-8031-4586-9687-f57d20707634)
-- ============================================================================

-- USER 1: kometsinkanyezi@gmail.com
DO $$
DECLARE
  v_user_id UUID := 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';
  v_family_id TEXT := '3c2388ee-148a-4b3c-9a2e-f56236826946';
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'DELETING USER 1: kometsinkanyezi@gmail.com';
  RAISE NOTICE '====================================';
  
  -- CRITICAL: Delete family FIRST (before profile)
  -- This avoids FK cascade trying to set owner_id to NULL
  DELETE FROM families WHERE id = v_family_id;
  RAISE NOTICE '✅ Family deleted';
  
  -- Then delete profile
  DELETE FROM profiles WHERE id = v_user_id;
  RAISE NOTICE '✅ Profile deleted';
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE NOTICE '✅ Auth user deleted';
  
  RAISE NOTICE '';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ User 1 deletion failed: %', SQLERRM;
  RAISE WARNING 'SQLSTATE: %', SQLSTATE;
END $$;

-- USER 2: nkazimulokometsi@gmail.com
DO $$
DECLARE
  v_user_id UUID := 'a86f3d4b-8031-4586-9687-f57d20707634';
  v_family_id TEXT;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'DELETING USER 2: nkazimulokometsi@gmail.com';
  RAISE NOTICE '====================================';
  
  -- Find their family_id
  SELECT id INTO v_family_id 
  FROM families 
  WHERE owner_id = v_user_id;
  
  IF v_family_id IS NULL THEN
    RAISE NOTICE '⚠️  No family found for this user';
  ELSE
    RAISE NOTICE 'Family ID: %', v_family_id;
  END IF;
  
  -- CRITICAL: Delete family FIRST (before profile)
  IF v_family_id IS NOT NULL THEN
    DELETE FROM families WHERE id = v_family_id;
    RAISE NOTICE '✅ Family deleted';
  END IF;
  
  -- Then delete profile
  DELETE FROM profiles WHERE id = v_user_id;
  RAISE NOTICE '✅ Profile deleted';
  
  -- Finally delete from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
  RAISE NOTICE '✅ Auth user deleted';
  
  RAISE NOTICE '';
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '❌ User 2 deletion failed: %', SQLERRM;
  RAISE WARNING 'SQLSTATE: %', SQLSTATE;
END $$;

-- VERIFY BOTH DELETIONS
SELECT 
  'kometsinkanyezi' as user,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
    THEN '❌ Still exists'
    ELSE '✅ Deleted'
  END as status
UNION ALL
SELECT 
  'nkazimulo',
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = 'a86f3d4b-8031-4586-9687-f57d20707634')
    THEN '❌ Still exists'
    ELSE '✅ Deleted'
  END;

-- FINAL STATUS
SELECT 
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM auth.users WHERE id IN (
      'bd1bb7db-f19b-4d16-b61f-42632d414f2e',
      'a86f3d4b-8031-4586-9687-f57d20707634'
    ))
    THEN '✅✅ BOTH USERS DELETED - Ready to test new registration!'
    ELSE '⚠️  Check individual status above'
  END as final_status;
