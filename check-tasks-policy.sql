-- ============================================================================
-- Check tasks policy and data
-- ============================================================================

-- Check if tasks SELECT policy exists
SELECT 
  policyname,
  cmd,
  qual,
  '✅ Policy' as type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tasks'
AND cmd = 'SELECT';

-- Check if tasks exist in database
SELECT 
  COUNT(*) as total_tasks,
  'Task count' as type
FROM public.tasks;

-- Try to select tasks directly (this won't work in SQL Editor but good for reference)
SELECT 
  id,
  title,
  family_id,
  created_by,
  status
FROM public.tasks
LIMIT 5;
