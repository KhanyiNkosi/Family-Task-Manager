-- ============================================================================
-- Comprehensive Trigger Recreation with Correct Events
-- ============================================================================
-- Ensures all triggers fire on the appropriate operations
-- ============================================================================

-- Drop ALL notification triggers
DROP TRIGGER IF EXISTS help_requested_notification ON tasks;
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
DROP TRIGGER IF EXISTS task_approved_notification ON tasks;
DROP TRIGGER IF EXISTS task_completed_notification ON tasks;

-- Recreate with correct events

-- Help requested: UPDATE only (changing help_requested flag)
CREATE TRIGGER help_requested_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_help_requested();

-- Task assigned: INSERT or UPDATE (initial assignment or reassignment)
CREATE TRIGGER task_assigned_notification
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- Task approved: UPDATE only (status change to approved)
CREATE TRIGGER task_approved_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_approved();

-- Task completed: UPDATE only (status change to completed)
CREATE TRIGGER task_completed_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

-- Verification
SELECT 
  t.tgname AS trigger_name,
  p.proname AS function_name,
  CASE t.tgtype & 66
    WHEN 2 THEN 'BEFORE'
    ELSE 'AFTER'
  END AS timing,
  TRIM(
    CASE WHEN (t.tgtype >> 2) & 1 = 1 THEN 'INSERT ' ELSE '' END ||
    CASE WHEN (t.tgtype >> 4) & 1 = 1 THEN 'UPDATE ' ELSE '' END ||
    CASE WHEN (t.tgtype >> 3) & 1 = 1 THEN 'DELETE ' ELSE '' END
  ) AS events
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'tasks'
  AND t.tgname IN (
    'help_requested_notification',
    'task_assigned_notification',
    'task_approved_notification',
    'task_completed_notification'
  )
ORDER BY t.tgname;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ TRIGGERS RECREATED WITH CORRECT EVENTS';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ help_requested_notification: UPDATE only';
  RAISE NOTICE '✅ task_assigned_notification: INSERT or UPDATE';
  RAISE NOTICE '✅ task_approved_notification: UPDATE only';
  RAISE NOTICE '✅ task_completed_notification: UPDATE only';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Ready to test!';
  RAISE NOTICE '====================================';
END $$;
