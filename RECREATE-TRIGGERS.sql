-- ============================================================================
-- VERIFY AND RECREATE TRIGGERS
-- ============================================================================
-- Run this to ensure triggers are properly attached to tables

-- Check current triggers on tasks table
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'tasks'::regclass
ORDER BY tgname;

-- Drop and recreate ALL triggers to ensure they use updated functions
DROP TRIGGER IF EXISTS task_completed_notification ON tasks;
DROP TRIGGER IF EXISTS task_approved_notification ON tasks;
DROP TRIGGER IF EXISTS task_assigned_notification ON tasks;
DROP TRIGGER IF EXISTS help_requested_notification ON tasks;

CREATE TRIGGER task_completed_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

CREATE TRIGGER task_approved_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_approved();

CREATE TRIGGER task_assigned_notification
  AFTER INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

CREATE TRIGGER help_requested_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_help_requested();

-- Verify triggers were created
SELECT 
  tgname AS trigger_name,
  tgenabled AS enabled,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'tasks'::regclass
ORDER BY tgname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ TRIGGERS RECREATED!';
  RAISE NOTICE '';
  RAISE NOTICE 'All 4 triggers have been dropped and recreated:';
  RAISE NOTICE '  • task_completed_notification';
  RAISE NOTICE '  • task_approved_notification';
  RAISE NOTICE '  • task_assigned_notification';
  RAISE NOTICE '  • help_requested_notification';
  RAISE NOTICE '';
  RAISE NOTICE 'These now use the updated trigger functions.';
  RAISE NOTICE 'Test by completing a task in your app!';
  RAISE NOTICE '';
END $$;
