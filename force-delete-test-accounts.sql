-- ============================================================================
-- Force Delete Remaining Test Accounts (Admin Version)
-- ============================================================================
-- This script uses admin-level deletions to remove stubborn accounts
-- Run this in Supabase SQL Editor if the safe version left accounts behind
-- ============================================================================

-- Target the 3 remaining accounts
-- (Adjust this list based on check-remaining-accounts.sql results)

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_family_id UUID;
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
  RAISE NOTICE 'FORCE DELETE - Admin Version';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';

  FOREACH v_email IN ARRAY v_emails
  LOOP
    RAISE NOTICE 'Force deleting: %', v_email;
    
    -- Get user ID and family_id
    SELECT u.id INTO v_user_id
    FROM auth.users u
    WHERE u.email = v_email;
    
    IF v_user_id IS NULL THEN
      RAISE NOTICE '  ✅ Already deleted or not found';
    ELSE
      RAISE NOTICE '  📝 User ID: %', v_user_id;
      
      -- Get family_id before deleting profile
      SELECT family_id INTO v_family_id 
      FROM public.profiles 
      WHERE id = v_user_id;
      
      RAISE NOTICE '  📝 Family ID: %', COALESCE(v_family_id::text, 'none');
      
      -- ===================================================================
      -- AGGRESSIVE DELETION SEQUENCE
      -- ===================================================================
      
      -- 1. Delete tasks (created_by or assigned_to)
      DELETE FROM public.tasks 
      WHERE created_by = v_user_id OR assigned_to = v_user_id;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      RAISE NOTICE '  🗑️  Deleted % tasks', v_row_count;
      
      -- 2. Delete reward redemptions
      DELETE FROM public.reward_redemptions 
      WHERE user_id = v_user_id;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      RAISE NOTICE '  🗑️  Deleted % reward redemptions', v_row_count;
      
      -- 3. Delete rewards
      DELETE FROM public.rewards 
      WHERE created_by = v_user_id;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      RAISE NOTICE '  🗑️  Deleted % rewards', v_row_count;
      
      -- 4. Delete notifications
      DELETE FROM public.notifications 
      WHERE user_id = v_user_id;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      RAISE NOTICE '  🗑️  Deleted % notifications', v_row_count;
      
      -- 5. Delete bulletin messages (by family_id)
      IF v_family_id IS NOT NULL THEN
        DELETE FROM public.bulletin_messages 
        WHERE family_id = v_family_id;
        GET DIAGNOSTICS v_row_count = ROW_COUNT;
        RAISE NOTICE '  🗑️  Deleted % bulletin messages', v_row_count;
      END IF;
      
      -- 6. Delete user settings
      DELETE FROM public.user_settings 
      WHERE user_id = v_user_id;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      RAISE NOTICE '  🗑️  Deleted % user settings', v_row_count;
      
      -- 7. Delete user_profiles
      DELETE FROM public.user_profiles 
      WHERE id = v_user_id;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      RAISE NOTICE '  🗑️  Deleted % user_profiles', v_row_count;
      
      -- 8. Delete profiles
      DELETE FROM public.profiles 
      WHERE id = v_user_id;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      RAISE NOTICE '  🗑️  Deleted % profiles', v_row_count;
      
      -- 9. DELETE FROM AUTH.USERS (requires admin)
      -- This is the critical step that might have failed before
      DELETE FROM auth.users 
      WHERE id = v_user_id;
      GET DIAGNOSTICS v_row_count = ROW_COUNT;
      
      IF v_row_count > 0 THEN
        RAISE NOTICE '  ✅ Deleted from auth.users';
        v_deleted_count := v_deleted_count + 1;
      ELSE
        RAISE NOTICE '  ❌ FAILED to delete from auth.users (may need Supabase dashboard)';
      END IF;
      
      -- 10. Optional: Clean up orphaned family if no other members
      IF v_family_id IS NOT NULL THEN
        DECLARE
          v_remaining_members INTEGER;
        BEGIN
          SELECT COUNT(*) INTO v_remaining_members
          FROM public.profiles
          WHERE family_id = v_family_id;
          
          IF v_remaining_members = 0 THEN
            DELETE FROM public.families WHERE id = v_family_id::text;
            RAISE NOTICE '  🗑️  Deleted orphaned family %', v_family_id;
          END IF;
        END;
      END IF;
      
      RAISE NOTICE '  ✅ Completed: %', v_email;
    END IF;
    
    RAISE NOTICE '';
  END LOOP;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Force deletion complete';
  RAISE NOTICE 'Accounts deleted: %', v_deleted_count;
  RAISE NOTICE '====================================';
  
  -- Show remaining count
  DECLARE
    v_remaining INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_remaining
    FROM auth.users
    WHERE email = ANY(v_emails);
    
    IF v_remaining = 0 THEN
      RAISE NOTICE '';
      RAISE NOTICE '🎉 SUCCESS! All test accounts deleted.';
      RAISE NOTICE 'You can now register fresh accounts for testing.';
    ELSE
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  WARNING: % accounts still remain', v_remaining;
      RAISE NOTICE 'These may need manual deletion from Supabase Dashboard:';
      RAISE NOTICE 'Authentication → Users → Search and delete manually';
    END IF;
  END;
  
END $$;

-- Final verification
SELECT 
  'VERIFICATION' as status,
  email,
  id,
  'Still exists - manual deletion needed' as action
FROM auth.users
WHERE email IN (
  'nkosik8@gmail.com',
  'kometsilwandle@gmail.com',
  'kometsinkanyezi@gmail.com',
  'nkazimulokometsi@gmail.com'
);
