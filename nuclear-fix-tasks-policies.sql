-- ============================================================================
-- Nuclear Option: Drop ALL Tasks Policies and Start Fresh
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Dropping ALL policies on tasks table...';
END $$;

-- Drop every single policy on tasks
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'tasks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON tasks', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ All tasks policies dropped';
END $$;

-- ============================================================================
-- Create Clean, Simple Policies
-- ============================================================================

-- Policy 1: Users can view tasks assigned to them
CREATE POLICY "tasks_view_assigned"
  ON tasks
  FOR SELECT
  USING (assigned_to = auth.uid());

-- Policy 2: Users can view tasks they created
CREATE POLICY "tasks_view_created"
  ON tasks
  FOR SELECT
  USING (created_by = auth.uid());

-- Policy 3: Users can view tasks in their family
CREATE POLICY "tasks_view_family"
  ON tasks
  FOR SELECT
  USING (
    family_id = (
      SELECT family_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Policy 4: Parents can create tasks in their family
CREATE POLICY "tasks_insert_parent"
  ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role = 'parent'
        AND family_id = tasks.family_id
    )
  );

-- Policy 5: Children can update their assigned tasks
CREATE POLICY "tasks_update_assigned"
  ON tasks
  FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Policy 6: Users can update tasks they created
CREATE POLICY "tasks_update_created"
  ON tasks
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy 7: Parents can update tasks in their family
CREATE POLICY "tasks_update_parent"
  ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role = 'parent'
        AND family_id = tasks.family_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role = 'parent'
        AND family_id = tasks.family_id
    )
  );

-- Policy 8: Parents can delete tasks in their family
CREATE POLICY "tasks_delete_parent"
  ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role = 'parent'
        AND family_id = tasks.family_id
    )
  );

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ New tasks policies created!';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 
  policyname,
  cmd,
  '✅ Active' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
ORDER BY policyname;

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'tasks';
  
  RAISE NOTICE '';
  RAISE NOTICE 'Total policies on tasks: %', v_count;
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Test now:';
  RAISE NOTICE '  1. Refresh page';
  RAISE NOTICE '  2. Complete a task';
  RAISE NOTICE '  3. Should work without errors';
  RAISE NOTICE '====================================';
END $$;
