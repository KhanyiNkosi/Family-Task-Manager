-- Fix RLS policy for photo uploads
-- Allow children to update their own tasks (photo_url, completed, completed_at, photo_uploaded_at)

-- Drop ALL existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS tasks_update_policy ON tasks;
DROP POLICY IF EXISTS tasks_update ON tasks;
DROP POLICY IF EXISTS tasks_update_family ON tasks;

-- Create comprehensive UPDATE policy for tasks (authenticated users only)
CREATE POLICY tasks_update_policy ON tasks
FOR UPDATE
TO authenticated
USING (
  -- Child can update their own tasks
  (auth.uid() = assigned_to)
  OR
  -- Parent can update tasks in their family
  (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid()
      AND p1.role = 'parent'
      AND p1.family_id = (
        SELECT family_id FROM profiles WHERE id = assigned_to
      )
    )
  )
)
WITH CHECK (
  -- Child can update their own tasks
  (auth.uid() = assigned_to)
  OR
  -- Parent can update tasks in their family
  (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid()
      AND p1.role = 'parent'
      AND p1.family_id = (
        SELECT family_id FROM profiles WHERE id = assigned_to
      )
    )
  )
);

-- Verify the policy was created
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'tasks' AND cmd = 'UPDATE';
