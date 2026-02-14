-- ============================================================================
-- Quick Fix: Tasks RLS Policies Type Mismatch
-- ============================================================================
-- This fixes common UUID/TEXT comparison issues in tasks policies
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing tasks RLS policies...';
END $$;

-- Drop all existing policies on tasks
DROP POLICY IF EXISTS "Users can view family tasks" ON tasks;
DROP POLICY IF EXISTS "Parents can create tasks" ON tasks;
DROP POLICY IF EXISTS "Parents can update tasks" ON tasks;
DROP POLICY IF EXISTS "Parents can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Children can update their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_select_family" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_family" ON tasks;
DROP POLICY IF EXISTS "tasks_update_family" ON tasks;
DROP POLICY IF EXISTS "tasks_delete_family" ON tasks;
DROP POLICY IF EXISTS "tasks_parents_delete" ON tasks;
DROP POLICY IF EXISTS "tasks_parents_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_parents_update" ON tasks;
DROP POLICY IF EXISTS "allow_view_own_or_assigned_tasks" ON tasks;
DROP POLICY IF EXISTS "allow_create_tasks" ON tasks;
DROP POLICY IF EXISTS "allow_update_own_tasks" ON tasks;
DROP POLICY IF EXISTS "allow_delete_own_tasks" ON tasks;

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped old policies';
END $$;

-- ============================================================================
-- Policy 1: Children can view and update their assigned tasks
-- ============================================================================

CREATE POLICY "children_update_assigned_tasks"
  ON tasks
  FOR UPDATE
  USING (
    assigned_to = auth.uid()  -- Both UUID, OK
  );

CREATE POLICY "children_view_assigned_tasks"
  ON tasks
  FOR SELECT
  USING (
    assigned_to = auth.uid()  -- Both UUID, OK
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Created children policies';
END $$;

-- ============================================================================
-- Policy 2: Users can view tasks in their family
-- ============================================================================

CREATE POLICY "view_family_tasks"
  ON tasks
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id::text  -- Cast to TEXT
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Created family view policy';
END $$;

-- ============================================================================
-- Policy 3: Parents can manage all tasks in their family
-- ============================================================================

CREATE POLICY "parents_manage_family_tasks"
  ON tasks
  FOR ALL
  USING (
    family_id IN (
      SELECT family_id::text  -- Cast to TEXT
      FROM profiles 
      WHERE id = auth.uid() AND role = 'parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id::text  -- Cast to TEXT
      FROM profiles 
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Created parent management policy';
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 
  'Policy Verification' as check,
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%::text%' OR with_check LIKE '%::text%' THEN '✅ Has TEXT cast'
    ELSE '✓ No cast needed'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
ORDER BY policyname;

DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'tasks';
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Tasks policies fixed!';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Total policies on tasks: %', v_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Test again:';
  RAISE NOTICE '  1. Complete a task';
  RAISE NOTICE '  2. Check console for errors';
  RAISE NOTICE '  3. Should see NO "operator does not exist" error';
END $$;
