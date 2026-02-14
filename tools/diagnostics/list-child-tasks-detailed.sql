-- Detailed task listing for child 17eb2a70-6fef-4f01-8303-03883c92e705
-- This will show ALL tasks to see if older ones aren't approved

-- 1. All tasks ordered by creation date (oldest first to see history)
SELECT 
  id,
  title,
  points,
  completed,
  approved,
  TO_CHAR(completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed_at,
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
  CASE 
    WHEN approved = true THEN '✓ APPROVED (counted)'
    WHEN completed = true AND (approved = false OR approved IS NULL) THEN '⚠ WAITING APPROVAL'
    ELSE '✗ NOT DONE'
  END as status
FROM tasks
WHERE assigned_to = '17eb2a70-6fef-4f01-8303-03883c92e705'
ORDER BY created_at ASC;

-- 2. Count tasks by approval status
SELECT 
  COUNT(*) as count,
  SUM(points) as total_points,
  CASE 
    WHEN approved = true THEN 'Approved (counted in balance)'
    WHEN completed = true THEN 'Completed but awaiting approval'
    ELSE 'Not completed'
  END as status
FROM tasks
WHERE assigned_to = '17eb2a70-6fef-4f01-8303-03883c92e705'
GROUP BY 
  CASE 
    WHEN approved = true THEN 'Approved (counted in balance)'
    WHEN completed = true THEN 'Completed but awaiting approval'
    ELSE 'Not completed'
  END
ORDER BY status;

-- 3. Check if there are any old tasks before a certain date
SELECT 
  COUNT(*) as old_tasks_count,
  SUM(points) as old_tasks_points,
  MIN(created_at) as oldest_task,
  MAX(created_at) as newest_task
FROM tasks
WHERE assigned_to = '17eb2a70-6fef-4f01-8303-03883c92e705'
AND created_at < NOW() - INTERVAL '7 days';

-- 4. Check for any tasks that might have been completed but never approved
SELECT 
  COUNT(*) as awaiting_approval_count,
  SUM(points) as awaiting_approval_points,
  STRING_AGG(title, ', ') as tasks_awaiting
FROM tasks
WHERE assigned_to = '17eb2a70-6fef-4f01-8303-03883c92e705'
AND completed = true
AND (approved = false OR approved IS NULL);
