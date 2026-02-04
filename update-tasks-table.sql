-- Add created_by column to tasks table if it doesn't exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing RLS policies for tasks to use created_by
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Allow users to view tasks they created or tasks assigned to them
CREATE POLICY "allow_view_own_or_assigned_tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- Allow users to create tasks
CREATE POLICY "allow_create_tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Allow users to update tasks they created
CREATE POLICY "allow_update_own_tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

-- Allow users to delete tasks they created
CREATE POLICY "allow_delete_own_tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
