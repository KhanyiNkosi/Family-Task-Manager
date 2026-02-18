-- FIX ACTIVITY FEED: Add approved tasks to activity feed automatically
-- This trigger will insert an entry into the activity_feed table whenever a task is approved

-- Create function to add approved task to activity feed
CREATE OR REPLACE FUNCTION add_approved_task_to_feed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if task was just approved (transitioned from false to true)
  IF NEW.approved = true AND (OLD.approved = false OR OLD.approved IS NULL) THEN
    INSERT INTO activity_feed (
      user_id,
      activity_type,
      title,
      description,
      metadata,
      family_id,
      created_at
    ) VALUES (
      NEW.assigned_to,  -- The child who completed the task
      'task_approved',
      NEW.title,
      'Task completed and approved',
      jsonb_build_object('task_id', NEW.id, 'points', NEW.points),
      NEW.family_id,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS task_approved_to_feed ON tasks;
CREATE TRIGGER task_approved_to_feed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION add_approved_task_to_feed();

-- Backfill: Add existing approved tasks to activity feed (that aren't already there)
-- Only add tasks that were approved but not yet in activity feed
INSERT INTO activity_feed (
  user_id,
  activity_type,
  title,
  description,
  metadata,
  family_id,
  created_at
)
SELECT 
  t.assigned_to,
  'task_approved',
  t.title,
  'Task completed and approved',
  jsonb_build_object('task_id', t.id, 'points', t.points),
  t.family_id,
  t.created_at  -- Use the task's created_at as the activity time
FROM tasks t
WHERE t.approved = true
  AND t.completed = true
  AND NOT EXISTS (
    SELECT 1 FROM activity_feed af
    WHERE af.metadata->>'task_id' = t.id::text 
      AND af.activity_type = 'task_approved'
  );

-- Verification query: Check approved tasks vs activity feed entries
SELECT 
  (SELECT COUNT(*) FROM tasks WHERE approved = true) as total_approved_tasks,
  (SELECT COUNT(*) FROM activity_feed WHERE activity_type = 'task_approved') as approved_in_feed,
  (SELECT COUNT(*) FROM activity_feed WHERE activity_type = 'task_approved') - 
    (SELECT COUNT(*) FROM tasks WHERE approved = true) as difference;
