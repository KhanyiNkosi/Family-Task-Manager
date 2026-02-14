-- ============================================================================
-- Fix Notification Triggers: Use Boolean Columns Instead of status
-- ============================================================================
-- The tasks table uses boolean columns (approved, completed, help_requested)
-- NOT a status text column. This fixes the "record 'new' has no field 'status'" error.
-- ============================================================================

-- ============================================================================
-- Fix: notify_task_approved - Use NEW.approved (boolean)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_task_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;
  v_task_title TEXT;
BEGIN
  -- Check if approved changed from false/null to true
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    v_family_id := NEW.family_id;
    v_task_title := NEW.title;
    
    -- Notify the child who completed the task
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, family_id, task_id)
      VALUES (
        NEW.assigned_to,
        'task_approved',
        'Task Approved!',
        'Your task "' || v_task_title || '" has been approved!',
        v_family_id,
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed notify_task_approved - now checks NEW.approved (boolean)';
END $$;

-- ============================================================================
-- Fix: notify_task_completed - Use NEW.completed (boolean)
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;
  v_parent_id UUID;
  v_task_title TEXT;
  v_child_name TEXT;
BEGIN
  -- Check if completed changed from false/null to true
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    v_family_id := NEW.family_id;
    v_task_title := NEW.title;
    
    -- Get child's name
    SELECT full_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.assigned_to;
    
    -- Notify all parents in the family
    FOR v_parent_id IN
      SELECT p.id
      FROM profiles p
      JOIN user_profiles up ON p.id = up.id
      WHERE p.family_id = v_family_id
        AND up.role = 'parent'
    LOOP
      INSERT INTO notifications (user_id, type, title, message, family_id, task_id)
      VALUES (
        v_parent_id,
        'task_completed',
        'Task Completed',
        COALESCE(v_child_name, 'A child') || ' completed: "' || v_task_title || '"',
        v_family_id,
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed notify_task_completed - now checks NEW.completed (boolean)';
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 
  proname as function_name,
  '✅ Updated to use boolean columns' as status
FROM pg_proc
WHERE proname IN ('notify_task_approved', 'notify_task_completed')
ORDER BY proname;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅✅✅ BOOLEAN COLUMN FIX APPLIED ✅✅✅';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed trigger functions:';
  RAISE NOTICE '  ✅ notify_task_approved → checks NEW.approved (boolean)';
  RAISE NOTICE '  ✅ notify_task_completed → checks NEW.completed (boolean)';
  RAISE NOTICE '';
  RAISE NOTICE 'No longer checking NEW.status (which does not exist)';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TEST NOW:';
  RAISE NOTICE '  1. Refresh browser';
  RAISE NOTICE '  2. Complete a task';
  RAISE NOTICE '  3. Should work!';
  RAISE NOTICE '====================================';
END $$;
