-- ============================================================================
-- Fix 2-Parent Dashboard Issues
-- ============================================================================
-- Run this AFTER running diagnose-2parent-dashboard.sql to identify the issue
-- ============================================================================

-- STEP 1: Fix parent family_id mismatch
-- If 2nd parent has different family_id than 1st parent, this fixes it

DO $$
DECLARE
  v_first_parent_email TEXT := 'nkazimulo@gmail.com';  -- Adjust if needed (1st parent)
  v_second_parent_email TEXT := 'kometsilwandle@gmail.com';  -- Adjust if needed (2nd parent)
  v_correct_family_id UUID;
  v_second_parent_id UUID;
  v_wrong_family_id UUID;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixing 2-Parent Family Linkage';
  RAISE NOTICE '========================================';
  
  -- Get the first parent's family_id (this is the correct one)
  SELECT family_id INTO v_correct_family_id
  FROM public.profiles
  WHERE email = v_first_parent_email
  AND role = 'parent';
  
  IF v_correct_family_id IS NULL THEN
    RAISE EXCEPTION 'First parent not found or has no family_id: %', v_first_parent_email;
  END IF;
  
  RAISE NOTICE 'First parent family_id: %', v_correct_family_id;
  
  -- Get the second parent's info
  SELECT id, family_id INTO v_second_parent_id, v_wrong_family_id
  FROM public.profiles
  WHERE email = v_second_parent_email
  AND role = 'parent';
  
  IF v_second_parent_id IS NULL THEN
    RAISE EXCEPTION 'Second parent not found: %', v_second_parent_email;
  END IF;
  
  RAISE NOTICE 'Second parent ID: %', v_second_parent_id;
  RAISE NOTICE 'Second parent current family_id: %', COALESCE(v_wrong_family_id::text, 'NULL');
  
  -- Check if they already have the same family_id
  IF v_wrong_family_id = v_correct_family_id THEN
    RAISE NOTICE '✅ Parents already share the same family_id!';
    RAISE NOTICE 'Issue must be elsewhere. Check task family_ids.';
  ELSE
    RAISE NOTICE '⚠️  Family IDs dont match! Fixing...';
    
    -- Update second parent to have the same family_id
    UPDATE public.profiles
    SET family_id = v_correct_family_id,
        updated_at = NOW()
    WHERE id = v_second_parent_id;
    
    RAISE NOTICE '✅ Updated second parent family_id to: %', v_correct_family_id;
    
    -- Update any tasks created by 2nd parent to have correct family_id
    UPDATE public.tasks
    SET family_id = v_correct_family_id
    WHERE created_by = v_second_parent_id
    AND (family_id IS NULL OR family_id != v_correct_family_id);
    
    RAISE NOTICE '✅ Updated tasks created by second parent';
    
    -- Delete the orphaned family if 2nd parent created one
    IF v_wrong_family_id IS NOT NULL AND v_wrong_family_id != v_correct_family_id THEN
      -- Check if anyone else uses this family
      DECLARE
        v_family_member_count INTEGER;
      BEGIN
        SELECT COUNT(*) INTO v_family_member_count
        FROM public.profiles
        WHERE family_id = v_wrong_family_id;
        
        IF v_family_member_count = 0 THEN
          DELETE FROM public.families WHERE id = v_wrong_family_id::text;
          RAISE NOTICE '🗑️  Deleted orphaned family: %', v_wrong_family_id;
        ELSE
          RAISE NOTICE '⚠️  Orphaned family % has % members, not deleting', v_wrong_family_id, v_family_member_count;
        END IF;
      END;
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Verification';
  RAISE NOTICE '========================================';
  
  -- Verify fix
  DECLARE
    v_parent_count INTEGER;
    v_family_task_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_parent_count
    FROM public.profiles
    WHERE family_id = v_correct_family_id
    AND role = 'parent';
    
    SELECT COUNT(*) INTO v_family_task_count
    FROM public.tasks
    WHERE family_id = v_correct_family_id;
    
    RAISE NOTICE 'Family %:', v_correct_family_id;
    RAISE NOTICE '  - Parents: %', v_parent_count;
    RAISE NOTICE '  - Tasks: %', v_family_task_count;
    
    IF v_parent_count = 2 THEN
      RAISE NOTICE '✅ SUCCESS! Both parents now in same family';
    ELSE
      RAISE NOTICE '⚠️  Expected 2 parents, found %', v_parent_count;
    END IF;
  END;
  
END $$;

-- STEP 2: Fix any NULL family_id tasks
-- This catches tasks created before the fix or with broken data

UPDATE public.tasks t
SET family_id = p.family_id
FROM public.profiles p
WHERE t.created_by = p.id
AND t.family_id IS NULL
AND p.family_id IS NOT NULL;

-- Show result
SELECT 
  'Fixed NULL family_id tasks' as action,
  COUNT(*) as tasks_fixed
FROM public.tasks
WHERE family_id IS NOT NULL
AND created_by IN (
  SELECT id FROM public.profiles 
  WHERE email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%'
);

-- STEP 3: Verify both parents see same tasks
SELECT 
  'Final Verification' as check_type,
  family_id,
  COUNT(*) as total_tasks,
  COUNT(DISTINCT created_by) as unique_creators
FROM public.tasks
WHERE family_id IN (
  SELECT family_id FROM public.profiles 
  WHERE role = 'parent' 
  AND (email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%')
)
GROUP BY family_id;
