-- ============================================================================
-- Fix Trigger Events: Ensure status-based triggers only fire on UPDATE
-- ============================================================================
-- The error "record 'new' has no field 'status'" suggests triggers are
-- firing on INSERT when they should only fire on UPDATE
-- ============================================================================

-- Drop existing triggers that check status changes
DROP TRIGGER IF EXISTS task_approved_notification ON tasks;
DROP TRIGGER IF EXISTS task_completed_notification ON tasks;

-- Recreate triggers - ONLY on UPDATE (not INSERT)

CREATE TRIGGER task_approved_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_approved();

CREATE TRIGGER task_completed_notification
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_completed();

-- Verify trigger definitions
SELECT 
  t.tgname AS trigger_name,
  CASE 
    WHEN (t.tgtype >> 2) & 1 = 1 THEN 'INSERT '
    ELSE ''
  END ||
  CASE 
    WHEN (t.tgtype >> 4) & 1 = 1 THEN 'UPDATE '
    ELSE ''
  END ||
  CASE 
    WHEN (t.tgtype >> 3) & 1 = 1 THEN 'DELETE '
    ELSE ''
  END AS events,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'tasks'
  AND t.tgname IN ('task_approved_notification', 'task_completed_notification')
ORDER BY t.tgname;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ TRIGGER EVENTS FIXED';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed triggers to fire only on UPDATE:';
  RAISE NOTICE '  ✅ task_approved_notification';
  RAISE NOTICE '  ✅ task_completed_notification';
  RAISE NOTICE '';
  RAISE NOTICE 'These triggers now only fire on UPDATE';
  RAISE NOTICE '(not on INSERT where OLD.status does not exist)';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TEST NOW:';
  RAISE NOTICE '  1. Refresh browser';
  RAISE NOTICE '  2. Complete a task';
  RAISE NOTICE '  3. Should work!';
  RAISE NOTICE '====================================';
END $$;
