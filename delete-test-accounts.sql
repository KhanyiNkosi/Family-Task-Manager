-- ============================================================================
-- Delete Test Accounts for 2-Parent Feature Testing (SAFE VERSION)
-- ============================================================================
-- This script removes the specified test accounts from auth.users and related tables
-- Checks for column/table existence before attempting deletions
-- Run this in Supabase SQL Editor to clean up before testing
-- ============================================================================

-- List of emails to delete
-- nkosik8@gmail.com
-- kometsilwandle@gmail.com
-- kometsinkanyezi@gmail.com [blocked]
-- nkazimulokometsi@gmail.com

BEGIN;

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_deleted_count INTEGER := 0;
  v_row_count INTEGER;
  v_emails TEXT[] := ARRAY[
    'nkosik8@gmail.com',
    'kometsilwandle@gmail.com',
    'kometsinkanyezi@gmail.com',
    'nkazimulokometsi@gmail.com'
  ];
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Starting deletion of test accounts...';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';

  -- Loop through each email
  FOREACH v_email IN ARRAY v_emails
  LOOP
    RAISE NOTICE 'Processing: %', v_email;
    
    -- Get user ID from auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
      RAISE NOTICE '  ⚠️  User not found in auth.users';
    ELSE
      RAISE NOTICE '  📝 Found user ID: %', v_user_id;
      
      -- ========================================================================
      -- Delete from related tables (safe with column checks)
      -- ========================================================================
      
      -- Delete tasks created by or assigned to this user
      BEGIN
        DELETE FROM public.tasks 
        WHERE created_by = v_user_id OR assigned_to = v_user_id;
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE '  ✅ Deleted % tasks', v_row_count;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠️  Tasks deletion skipped: %', SQLERRM;
      END;
      
      -- Delete reward redemptions
      BEGIN
        DELETE FROM public.reward_redemptions WHERE user_id = v_user_id;
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE '  ✅ Deleted % reward redemptions', v_row_count;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠️  Reward redemptions deletion skipped: %', SQLERRM;
      END;
      
      -- Delete rewards created by user
      BEGIN
        DELETE FROM public.rewards WHERE created_by = v_user_id;
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE '  ✅ Deleted % rewards', v_row_count;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠️  Rewards deletion skipped: %', SQLERRM;
      END;
      
      -- Delete notifications
      BEGIN
        DELETE FROM public.notifications WHERE user_id = v_user_id;
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE '  ✅ Deleted % notifications', v_row_count;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠️  Notifications deletion skipped: %', SQLERRM;
      END;
      
      -- Delete bulletin messages (family_id based, not created_by)
      BEGIN
        -- First, get the user's family_id to delete their family's messages
        DECLARE
          v_family_id UUID;
        BEGIN
          SELECT family_id INTO v_family_id FROM public.profiles WHERE id = v_user_id;
          
          IF v_family_id IS NOT NULL THEN
            DELETE FROM public.bulletin_messages WHERE family_id = v_family_id;
            GET DIAGNOSTICS v_row_count = ROW_COUNT;
            RAISE NOTICE '  ✅ Deleted % bulletin messages', v_row_count;
          ELSE
            RAISE NOTICE '  ℹ️  No family_id found, skipping bulletin messages';
          END IF;
        END;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠️  Bulletin messages deletion skipped: %', SQLERRM;
      END;
      
      -- Delete user settings
      BEGIN
        DELETE FROM public.user_settings WHERE user_id = v_user_id;
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE '  ✅ Deleted % user settings', v_row_count;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠️  User settings deletion skipped: %', SQLERRM;
      END;
      
      -- Delete from user_profiles
      BEGIN
        DELETE FROM public.user_profiles WHERE id = v_user_id;
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE '  ✅ Deleted user profile', v_row_count;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠️  User profiles deletion skipped: %', SQLERRM;
      END;
      
      -- Delete from profiles
      BEGIN
        DELETE FROM public.profiles WHERE id = v_user_id;
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE '  ✅ Deleted profile';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ⚠️  Profiles deletion skipped: %', SQLERRM;
      END;
      
      -- Finally, delete from auth.users
      BEGIN
        DELETE FROM auth.users WHERE id = v_user_id;
        RAISE NOTICE '  ✅ Deleted from auth.users';
        v_deleted_count := v_deleted_count + 1;
        RAISE NOTICE '  ✅ Successfully deleted: %', v_email;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '  ❌ FAILED to delete from auth.users: %', SQLERRM;
      END;
      
    END IF;
    
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Deletion Complete!';
  RAISE NOTICE 'Total accounts deleted: %', v_deleted_count;
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now create fresh test accounts for:';
  RAISE NOTICE '  1. First parent (creates new family)';
  RAISE NOTICE '  2. Second parent (joins existing family)';
  RAISE NOTICE '  3. Child account (optional)';
  RAISE NOTICE '';
  RAISE NOTICE 'Testing checklist:';
  RAISE NOTICE '  ☐ Register 1st parent → Get family code';
  RAISE NOTICE '  ☐ Register 2nd parent → Join with code';
  RAISE NOTICE '  ☐ Verify both see same tasks';
  RAISE NOTICE '  ☐ Verify 3-task limit applies to family';
  RAISE NOTICE '  ☐ Try 3rd parent → Should be rejected';
  RAISE NOTICE '====================================';
  
END $$;

COMMIT;

-- Optional: Verify deletion
SELECT 
  'Remaining test accounts' as check_type,
  COUNT(*) as count
FROM auth.users
WHERE email IN (
  'nkosik8@gmail.com',
  'kometsilwandle@gmail.com',
  'kometsinkanyezi@gmail.com',
  'nkazimulokometsi@gmail.com'
);
-- Should return 0
