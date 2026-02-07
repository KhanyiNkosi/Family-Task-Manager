-- Check tasks table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Check sample tasks to see current data
SELECT 
  id,
  title,
  status,
  completed,
  approved,
  points,
  assigned_to
FROM tasks
LIMIT 5;

-- Check RLS policies on tasks
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks';
