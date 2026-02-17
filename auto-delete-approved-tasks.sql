-- Auto-Delete Approved Tasks After 24 Hours
-- This keeps the database clean and ensures free users can create new tasks
-- Run this in Supabase SQL Editor

-- Option A: DELETE IMMEDIATELY upon approval (aggressive cleanup)
CREATE OR REPLACE FUNCTION delete_approved_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task is approved, delete it immediately
  -- Points have already been awarded, so we don't need to keep it
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    DELETE FROM tasks WHERE id = NEW.id;
    RETURN NULL; -- NULL means the row was deleted
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_delete_approved_tasks ON tasks;

-- Create trigger
CREATE TRIGGER auto_delete_approved_tasks
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION delete_approved_tasks();

-- Verify trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'auto_delete_approved_tasks';

-- Test: Clean up existing approved tasks older than 24 hours
-- (Run this once to clean up backlog)
DELETE FROM tasks 
WHERE approved = true 
  AND completed_at < NOW() - INTERVAL '24 hours';

-- Show how many tasks remain
SELECT 
  COUNT(*) FILTER (WHERE approved = false) as active_tasks,
  COUNT(*) FILTER (WHERE approved = true) as approved_tasks,
  COUNT(*) as total_tasks
FROM tasks;

-- ============================================
-- IMPORTANT NOTES:
-- ============================================
/*
This trigger IMMEDIATELY DELETES approved tasks.

Pros:
✅ Free users can always create new tasks after completing 3
✅ Database stays clean (no old completed tasks piling up)
✅ Task limit of 3 works correctly

Cons:
⚠️  No task history (approved tasks are gone forever)
⚠️  Can't see past completed tasks in UI
⚠️  Can't track long-term stats from approved tasks

If you want to KEEP task history:
- Remove this trigger
- Keep the current filter logic (it already excludes approved tasks from the count)
- The limit check in handleAddTask already uses activeTasks.length which excludes approved

Alternative: Keep approved tasks for 30 days, then delete:
*/

-- Option B: DELETE after 30 days (keeps short-term history)
CREATE OR REPLACE FUNCTION delete_old_approved_tasks()
RETURNS void AS $$
BEGIN
  DELETE FROM tasks 
  WHERE approved = true 
    AND completed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule this to run daily (requires pg_cron extension):
-- SELECT cron.schedule('delete-old-approved-tasks', '0 2 * * *', 'SELECT delete_old_approved_tasks()');

-- Or run manually as needed:
-- SELECT delete_old_approved_tasks();
