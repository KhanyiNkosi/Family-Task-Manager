-- ============================================================================
-- Diagnose 2-Parent Visibility Issues
-- ============================================================================
-- Check if 2nd parent is properly linked and can see family data
-- ============================================================================

-- Replace these with your actual test emails
DO $$
DECLARE
  v_parent1_email TEXT := 'nkanyezi@example.com';  -- Replace with 1st parent email
  v_parent2_email TEXT := 'nkazimulu@example.com';  -- Replace with 2nd parent email
  v_parent1_id UUID;
  v_parent2_id UUID;
  v_parent1_family_id UUID;
  v_parent2_family_id UUID;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '2-Parent Visibility Diagnostic';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';

  -- Get 1st parent info
  SELECT id INTO v_parent1_id FROM auth.users WHERE email = v_parent1_email;
  SELECT family_id INTO v_parent1_family_id FROM public.profiles WHERE id = v_parent1_id;
  
  RAISE NOTICE '1st Parent:';
  RAISE NOTICE '  Email: %', v_parent1_email;
  RAISE NOTICE '  User ID: %', v_parent1_id;
  RAISE NOTICE '  Family ID: %', v_parent1_family_id;
  RAISE NOTICE '';

  -- Get 2nd parent info
  SELECT id INTO v_parent2_id FROM auth.users WHERE email = v_parent2_email;
  SELECT family_id INTO v_parent2_family_id FROM public.profiles WHERE id = v_parent2_id;
  
  RAISE NOTICE '2nd Parent:';
  RAISE NOTICE '  Email: %', v_parent2_email;
  RAISE NOTICE '  User ID: %', v_parent2_id;
  RAISE NOTICE '  Family ID: %', v_parent2_family_id;
  RAISE NOTICE '';

  -- Check if family IDs match
  IF v_parent1_family_id = v_parent2_family_id THEN
    RAISE NOTICE '✅ SUCCESS: Both parents have SAME family_id';
  ELSE
    RAISE NOTICE '❌ PROBLEM: Parents have DIFFERENT family_ids!';
    RAISE NOTICE '   Parent 1 family: %', v_parent1_family_id;
    RAISE NOTICE '   Parent 2 family: %', v_parent2_family_id;
    RAISE NOTICE '   ACTION: Run fix script to update parent 2 family_id';
  END IF;
  RAISE NOTICE '';

  -- Check family record exists
  DECLARE
    v_family_exists BOOLEAN;
  BEGIN
    SELECT EXISTS(SELECT 1 FROM public.families WHERE id = v_parent1_family_id::text) 
    INTO v_family_exists;
    
    IF v_family_exists THEN
      RAISE NOTICE '✅ Family record exists in families table';
    ELSE
      RAISE NOTICE '⚠️  WARNING: No family record found for family_id %', v_parent1_family_id;
    END IF;
  END;
  RAISE NOTICE '';

  -- Count tasks in family
  DECLARE
    v_task_count INTEGER;
    v_parent1_tasks INTEGER;
    v_parent2_tasks INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_task_count 
    FROM public.tasks 
    WHERE family_id = v_parent1_family_id;
    
    SELECT COUNT(*) INTO v_parent1_tasks
    FROM public.tasks
    WHERE created_by = v_parent1_id;
    
    SELECT COUNT(*) INTO v_parent2_tasks
    FROM public.tasks
    WHERE created_by = v_parent2_id;
    
    RAISE NOTICE 'Tasks:';
    RAISE NOTICE '  Total family tasks: %', v_task_count;
    RAISE NOTICE '  Created by parent 1: %', v_parent1_tasks;
    RAISE NOTICE '  Created by parent 2: %', v_parent2_tasks;
  END;
  RAISE NOTICE '';

  -- Count family members
  DECLARE
    v_parent_count INTEGER;
    v_child_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_parent_count
    FROM public.profiles
    WHERE family_id = v_parent1_family_id AND role = 'parent';
    
    SELECT COUNT(*) INTO v_child_count
    FROM public.profiles
    WHERE family_id = v_parent1_family_id AND role = 'child';
    
    RAISE NOTICE 'Family Members:';
    RAISE NOTICE '  Parents: %', v_parent_count;
    RAISE NOTICE '  Children: %', v_child_count;
    
    IF v_parent_count = 2 THEN
      RAISE NOTICE '  ✅ Correct: 2 parents registered';
    ELSIF v_parent_count = 1 THEN
      RAISE NOTICE '  ⚠️  Only 1 parent found - 2nd parent not properly linked';
    ELSE
      RAISE NOTICE '  ⚠️  Unexpected parent count: %', v_parent_count;
    END IF;
  END;
  RAISE NOTICE '';

  RAISE NOTICE '====================================';
  RAISE NOTICE 'Diagnostic Complete';
  RAISE NOTICE '====================================';

END $$;

-- Query to show all family members
SELECT 
  'Family Members' as info,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.family_id,
  CASE 
    WHEN EXISTS(SELECT 1 FROM auth.users WHERE id = p.id) THEN 'Active'
    ELSE 'No auth record'
  END as auth_status
FROM public.profiles p
WHERE p.family_id IN (
  SELECT DISTINCT family_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('nkanyezi@example.com', 'nkazimulu@example.com')  -- Update with actual emails
  )
)
ORDER BY p.role DESC, p.created_at;

-- Query to show all tasks in the family
SELECT 
  'Family Tasks' as info,
  t.id,
  t.title,
  t.family_id,
  t.created_by,
  creator.full_name as creator_name,
  t.assigned_to,
  assignee.full_name as assigned_to_name,
  t.approved,
  t.completed,
  t.created_at
FROM public.tasks t
LEFT JOIN public.profiles creator ON t.created_by = creator.id
LEFT JOIN public.profiles assignee ON t.assigned_to = assignee.id
WHERE t.family_id IN (
  SELECT DISTINCT family_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('nkanyezi@example.com', 'nkazimulo@example.com')  -- Update with actual emails
  )
)
ORDER BY t.created_at DESC;
