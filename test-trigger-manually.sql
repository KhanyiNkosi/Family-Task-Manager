-- Test if the trigger actually fires when we update a task
-- This simulates what the UI does when approving a task

-- First, let's see a task that's completed but not approved
SELECT 
  id,
  title,
  assigned_to,
  points,
  completed,
  approved
FROM tasks
WHERE completed = true AND (approved = false OR approved IS NULL)
LIMIT 1;

-- Now manually approve it to test if trigger fires
-- IMPORTANT: Copy the task ID from above and replace 'TASK_ID_HERE' below
-- UPDATE tasks 
-- SET approved = true 
-- WHERE id = 'TASK_ID_HERE';

-- After running the UPDATE, check if the user's XP increased:
-- SELECT total_xp, level FROM profiles WHERE id = 'USER_ID_HERE';
