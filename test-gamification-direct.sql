-- Test the gamification function directly and see results
SELECT 
  process_task_approval_gamification(
    (SELECT assigned_to FROM tasks WHERE approved = true ORDER BY created_at DESC LIMIT 1),
    (SELECT points FROM tasks WHERE approved = true ORDER BY created_at DESC LIMIT 1)
  ) as gamification_result;
