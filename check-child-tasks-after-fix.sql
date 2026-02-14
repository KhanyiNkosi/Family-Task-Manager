-- Check the state of all tasks for the child user
SELECT 
  id,
  title,
  completed,
  approved,
  help_requested,
  assigned_to,
  created_by,
  family_id,
  created_at,
  completed_at
FROM tasks
WHERE assigned_to = 'ddd979b5-8617-4e7b-a138-4868c7d18e00'
ORDER BY created_at DESC;

-- Check if any notifications were created
SELECT 
  id,
  user_id,
  type,
  title,
  message,
  created_at,
  read
FROM notifications
WHERE family_id = '519e50cd-5459-4ade-936a-671ea9bea488'
ORDER BY created_at DESC
LIMIT 10;

-- Check activity feed
SELECT 
  id,
  activity_type,
  title,
  description,
  user_id,
  family_id,
  created_at
FROM activity_feed
WHERE family_id = '519e50cd-5459-4ade-936a-671ea9bea488'
ORDER BY created_at DESC
LIMIT 10;
