-- ============================================================================
-- Fix 2nd Parent Family Linking
-- ============================================================================
-- This script manually links the 2nd parent to the correct family
-- Run AFTER running diagnose-2parent-visibility.sql to identify the issue
-- ============================================================================

-- INSTRUCTIONS:
-- 1. Replace the email addresses with your actual test accounts
-- 2. Run this in Supabase SQL Editor
-- 3. Verify the fix by running diagnose-2parent-visibility.sql again
-- ============================================================================

DO $$
DECLARE
  v_parent1_email TEXT := 'nkanyezi@example.com';  -- Replace with actual 1st parent email
  v_parent2_email TEXT := 'nkazimulu@example.com';  --Replace with actual 2nd parent email
  v_parent1_id UUID;
  v_parent2_id UUID;
  v_correct_family_id UUID;
  v_parent2_current_family UUID;
  v_updated BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Fixing 2nd Parent Family Link';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';

  -- Get 1st parent's family_id (this is the correct one)
  SELECT id INTO v_parent1_id FROM auth.users WHERE email = v_parent1_email;
  SELECT family_id INTO v_correct_family_id FROM public.profiles WHERE id = v_parent1_id;
  
  RAISE NOTICE '1st Parent family_id: %', v_correct_family_id;

  -- Get 2nd parent info
  SELECT id INTO v_parent2_id FROM auth.users WHERE email = v_parent2_email;
  SELECT family_id INTO v_parent2_current_family FROM public.profiles WHERE id = v_parent2_id;
  
  RAISE NOTICE '2nd Parent current family_id: %', v_parent2_current_family;
  RAISE NOTICE '';

  -- Check if fix is needed
  IF v_correct_family_id IS NULL THEN
    RAISE EXCEPTION '❌ 1st parent has no family_id! Cannot proceed.';
  END IF;

  IF v_parent2_id IS NULL THEN
    RAISE EXCEPTION '❌ 2nd parent not found in auth.users! Check email.';
  END IF;

  IF v_parent2_current_family = v_correct_family_id THEN
    RAISE NOTICE '✅ 2nd parent already has correct family_id. No fix needed.';
  ELSE
    RAISE NOTICE '🔧 Updating 2nd parent family_id...';
    
    -- Update the 2nd parent's profile
    UPDATE public.profiles
    SET family_id = v_correct_family_id,
        updated_at = NOW()
    WHERE id = v_parent2_id;
    
    v_updated := TRUE;
    RAISE NOTICE '✅ Updated 2nd parent profile.family_id to: %', v_correct_family_id;
    RAISE NOTICE '';

    -- If 2nd parent had tasks in wrong family, move them
    DECLARE
      v_moved_tasks INTEGER;
    BEGIN
      UPDATE public.tasks
      SET family_id = v_correct_family_id
      WHERE created_by = v_parent2_id
        AND (family_id != v_correct_family_id OR family_id IS NULL);
      
      GET DIAGNOSTICS v_moved_tasks = ROW_COUNT;
      
      IF v_moved_tasks > 0 THEN
        RAISE NOTICE '✅ Moved % tasks to correct family', v_moved_tasks;
      ELSE
        RAISE NOTICE 'ℹ️  No tasks needed to be moved';
      END IF;
    END;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Verification:';
  RAISE NOTICE '====================================';

  -- Verify the fix
  DECLARE
    v_parent_count INTEGER;
    v_family_tasks INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_parent_count
    FROM public.profiles
    WHERE family_id = v_correct_family_id AND role = 'parent';
    
    SELECT COUNT(*) INTO v_family_tasks
    FROM public.tasks
    WHERE family_id = v_correct_family_id;
    
    RAISE NOTICE '  Family ID: %', v_correct_family_id;
    RAISE NOTICE '  Parents in family: %', v_parent_count;
    RAISE NOTICE '  Tasks in family: %', v_family_tasks;
    RAISE NOTICE '';

    IF v_parent_count = 2 THEN
      RAISE NOTICE '✅ SUCCESS! Both parents now in same family.';
      RAISE NOTICE '';
      RAISE NOTICE 'Next steps:';
      RAISE NOTICE '  1. Have 2nd parent log out and log back in';
      RAISE NOTICE '  2. Both parents should now see all family tasks';
      RAISE NOTICE '  3. Test creating tasks from both accounts';
    ELSE
      RAISE NOTICE '⚠️  WARNING: Expected 2 parents, found %', v_parent_count;
    END IF;
  END;

  RAISE NOTICE '====================================';

END $$;
