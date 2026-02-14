-- ============================================================================
-- Fixed: Tasks Policies with Explicit Table Prefixes
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing tasks policies with explicit table prefixes...';
END $$;

-- Drop all policies first
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
  END LOOP;
END $$;

-- ============================================================================
-- Create Corrected Policies with Explicit Casts
-- ============================================================================

-- Policy 1: Users can view tasks assigned to them
CREATE POLICY "tasks_view_assigned"
  ON tasks
  FOR SELECT
  USING (tasks.assigned_to = auth.uid());

-- Policy 2: Users can view tasks they created
CREATE POLICY "tasks_view_created"
  ON tasks
  FOR SELECT
  USING (tasks.created_by = auth.uid());

-- Policy 3: Users can view tasks in their family
CREATE POLICY "tasks_view_family"
  ON tasks
  FOR SELECT
  USING (
    tasks.family_id IN (
      SELECT p.family_id 
      FROM profiles p
      WHERE p.id = auth.uid()
    )
  );

-- Policy 4: Parents can create tasks
CREATE POLICY "tasks_insert_parent"
  ON tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'parent'
        AND p.family_id = tasks.family_id
    )
  );

-- Policy 5: Children can update their assigned tasks
CREATE POLICY "tasks_update_assigned"
  ON tasks
  FOR UPDATE
  USING (tasks.assigned_to = auth.uid())
  WITH CHECK (tasks.assigned_to = auth.uid());

-- Policy 6: Users can update tasks they created
CREATE POLICY "tasks_update_created"
  ON tasks
  FOR UPDATE
  USING (tasks.created_by = auth.uid())
  WITH CHECK (tasks.created_by = auth.uid());

-- Policy 7: Parents can update tasks in their family
CREATE POLICY "tasks_update_parent"
  ON tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'parent'
        AND p.family_id = tasks.family_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'parent'
        AND p.family_id = tasks.family_id
    )
  );

-- Policy 8: Parents can delete tasks in their family
CREATE POLICY "tasks_delete_parent"
  ON tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
        AND p.role = 'parent'
        AND p.family_id = tasks.family_id
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Policies recreated with explicit prefixes';
END $$;

-- ============================================================================
-- Diagnostic: Show actual data types being compared
-- ============================================================================

SELECT 
  'Column Types Check' as check,
  'tasks.family_id' as column_name,
  (SELECT data_type FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'family_id') as data_type
UNION ALL
SELECT 
  'Column Types Check',
  'profiles.family_id',
  (SELECT data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'family_id')
UNION ALL
SELECT 
  'Column Types Check',
  'tasks.assigned_to',
  (SELECT data_type FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assigned_to')
UNION ALL
SELECT 
  'Column Types Check',
  'tasks.created_by',
  (SELECT data_type FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'created_by')
UNION ALL
SELECT 
  'Column Types Check',
  'profiles.id',
  (SELECT data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id');

-- ============================================================================
-- Show all active policies
-- ============================================================================

SELECT 
  policyname,
  cmd,
  '✅' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
ORDER BY policyname;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Try again now';
  RAISE NOTICE '====================================';
END $$;
