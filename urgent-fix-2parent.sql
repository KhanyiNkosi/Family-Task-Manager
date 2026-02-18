-- ============================================================================
-- URGENT FIX: Link 2nd Parent to Family and Fix Tasks
-- ============================================================================
-- Run this immediately to fix the 2-parent dashboard issues
-- ============================================================================

DO $$
DECLARE
  v_first_parent_id UUID;
  v_first_parent_family_id UUID;
  v_second_parent_id UUID;
  v_second_parent_family_id UUID;
  v_tasks_fixed INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'URGENT FIX: 2-Parent Dashboard';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- Find first parent (nkanyezi - the one who created the family)
  SELECT id, family_id INTO v_first_parent_id, v_first_parent_family_id
  FROM public.profiles
  WHERE email LIKE '%nkanyezi%'
  AND role = 'parent'
  LIMIT 1;
  
  IF v_first_parent_id IS NULL THEN
    RAISE EXCEPTION 'First parent (nkanyezi) not found!';
  END IF;
  
  RAISE NOTICE '1st Parent (nkanyezi):';
  RAISE NOTICE '  ID: %', v_first_parent_id;
  RAISE NOTICE '  Family ID: %', COALESCE(v_first_parent_family_id::text, 'NULL');
  RAISE NOTICE '';
  
  -- Find second parent (nkazimulo - who should have joined)
  SELECT id, family_id INTO v_second_parent_id, v_second_parent_family_id
  FROM public.profiles
  WHERE email LIKE '%nkazimulo%'
  AND role = 'parent'
  LIMIT 1;
  
  IF v_second_parent_id IS NULL THEN
    RAISE EXCEPTION 'Second parent (nkazimulo) not found!';
  END IF;
  
  RAISE NOTICE '2nd Parent (nkazimulo):';
  RAISE NOTICE '  ID: %', v_second_parent_id;
  RAISE NOTICE '  Family ID: %', COALESCE(v_second_parent_family_id::text, 'NULL');
  RAISE NOTICE '';
  
  -- Check if they have the same family_id
  IF v_second_parent_family_id IS NULL OR v_second_parent_family_id != v_first_parent_family_id THEN
    RAISE NOTICE '🔧 FIXING: 2nd parent has wrong family_id!';
    RAISE NOTICE '  Correct family_id: %', v_first_parent_family_id;
    RAISE NOTICE '  2nd parent current: %', COALESCE(v_second_parent_family_id::text, 'NULL');
    RAISE NOTICE '';
    
    -- Fix the 2nd parent's family_id
    UPDATE public.profiles
    SET family_id = v_first_parent_family_id,
        updated_at = NOW()
    WHERE id = v_second_parent_id;
    
    RAISE NOTICE '✅ Updated 2nd parent family_id to: %', v_first_parent_family_id;
    
    -- Fix any tasks created by 2nd parent
    UPDATE public.tasks
    SET family_id = v_first_parent_family_id
    WHERE created_by = v_second_parent_id
    AND (family_id IS NULL OR family_id != v_first_parent_family_id);
    
    GET DIAGNOSTICS v_tasks_fixed = ROW_COUNT;
    RAISE NOTICE '✅ Fixed % tasks created by 2nd parent', v_tasks_fixed;
    
    -- Clean up any orphaned family
    IF v_second_parent_family_id IS NOT NULL AND v_second_parent_family_id != v_first_parent_family_id THEN
      DELETE FROM public.families WHERE id = v_second_parent_family_id::text;
      RAISE NOTICE '🗑️  Deleted orphaned family: %', v_second_parent_family_id;
    END IF;
  ELSE
    RAISE NOTICE '✅ Both parents already have same family_id!';
    RAISE NOTICE '  Family ID: %', v_first_parent_family_id;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL STATUS';
  RAISE NOTICE '========================================';
  
  -- Show final state
  DECLARE
    v_total_parents INTEGER;
    v_total_children INTEGER;
    v_total_tasks INTEGER;
    v_family_members TEXT;
  BEGIN
    -- Count family members
    SELECT COUNT(*) INTO v_total_parents
    FROM public.profiles
    WHERE family_id = v_first_parent_family_id
    AND role = 'parent';
    
    SELECT COUNT(*) INTO v_total_children
    FROM public.profiles
    WHERE family_id = v_first_parent_family_id
    AND role = 'child';
    
    -- Count family tasks
    SELECT COUNT(*) INTO v_total_tasks
    FROM public.tasks
    WHERE family_id = v_first_parent_family_id;
    
    -- List all family members
    SELECT STRING_AGG(full_name || ' (' || role || ')', ', ' ORDER BY role DESC, full_name)
    INTO v_family_members
    FROM public.profiles
    WHERE family_id = v_first_parent_family_id;
    
    RAISE NOTICE 'Family %:', v_first_parent_family_id;
    RAISE NOTICE '  Parents: %', v_total_parents;
    RAISE NOTICE '  Children: %', v_total_children;
    RAISE NOTICE '  Total Tasks: %', v_total_tasks;
    RAISE NOTICE '  Members: %', v_family_members;
    RAISE NOTICE '';
    
    IF v_total_parents = 2 THEN
      RAISE NOTICE '🎉 SUCCESS! Both parents now linked to same family!';
      RAISE NOTICE '   Refresh both parent dashboards to see tasks.';
    ELSE
      RAISE NOTICE '⚠️  Expected 2 parents, found %', v_total_parents;
    END IF;
  END;
  
END $$;

-- Verify tasks are visible
SELECT 
  'TASKS VERIFICATION' as check_type,
  t.title,
  t.family_id,
  p_creator.full_name as created_by_name,
  p_assigned.full_name as assigned_to_name,
  t.completed,
  t.approved
FROM public.tasks t
LEFT JOIN public.profiles p_creator ON t.created_by = p_creator.id
LEFT JOIN public.profiles p_assigned ON t.assigned_to = p_assigned.id
WHERE t.family_id IN (
  SELECT family_id FROM public.profiles 
  WHERE email LIKE '%nkanyezi%' 
  AND role = 'parent'
)
ORDER BY t.created_at DESC;
