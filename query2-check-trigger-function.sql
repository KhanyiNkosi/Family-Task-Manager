-- Query 2: Check if the trigger function exists
SELECT 
  proname as function_name,
  prosrc as function_source
FROM pg_proc
WHERE proname = 'trigger_task_approval_gamification';
