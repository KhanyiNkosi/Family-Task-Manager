-- Check and fix RLS policies for task completion
-- Run this in Supabase SQL Editor

-- 1. Check current policies on tasks table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'tasks'
ORDER BY policyname;

-- If children cannot update their own tasks, add this policy:
DROP POLICY IF EXISTS "Children can complete their own tasks" ON tasks;
CREATE POLICY "Children can complete their own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (
    assigned_to = auth.uid() AND
    -- Only allow updating completion-related fields
    (completed IS NOT DISTINCT FROM OLD.completed OR completed = true) AND
    (approved IS NOT DISTINCT FROM OLD.approved OR approved = OLD.approved)
  );

-- Make sure there's also a SELECT policy for children
DROP POLICY IF EXISTS "Children view assigned tasks" ON tasks;
CREATE POLICY "Children view assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    created_by = auth.uid()
  );
