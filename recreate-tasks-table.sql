-- Check current tasks table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Drop and recreate tasks table with proper schema
DROP TABLE IF EXISTS public.tasks CASCADE;

CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  category TEXT DEFAULT 'general',
  task_status TEXT DEFAULT 'pending' CHECK (task_status IN ('pending', 'completed', 'approved')),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  family_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "allow_view_own_or_assigned_tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "allow_create_tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "allow_update_own_tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "allow_delete_own_tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
