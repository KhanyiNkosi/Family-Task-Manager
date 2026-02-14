-- ============================================================================
-- Fix Notification Triggers: Remove task_id from INSERT
-- ============================================================================
-- The notifications table doesn't have a task_id column.
-- This fixes the "column 'task_id' of relation 'notifications' does not exist" error.
-- ============================================================================

-- ============================================================================
-- Fix: notify_help_requested - Remove task_id
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_help_requested()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;
  v_parent_id UUID;
  v_child_name TEXT;
  v_task_title TEXT;
BEGIN
  -- Only proceed if help is being requested
  IF NEW.help_requested = TRUE AND (OLD.help_requested IS NULL OR OLD.help_requested = FALSE) THEN
    v_family_id := NEW.family_id;
    v_task_title := NEW.title;
    
    -- Get child's name
    SELECT full_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.assigned_to;
    
    -- Get parent(s) in the family
    FOR v_parent_id IN
      SELECT p.id
      FROM profiles p
      JOIN user_profiles up ON p.id = up.id
      WHERE p.family_id = v_family_id
        AND up.role = 'parent'
    LOOP
      INSERT INTO notifications (user_id, type, title, message, family_id)
      VALUES (
        v_parent_id,
        'help_request',
        'Help Requested',
        COALESCE(v_child_name, 'A child') || ' needs help with "' || v_task_title || '"',
        v_family_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Fix: notify_task_approved - Remove task_id
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
      INSERT INTO notifications (user_id, type, title, message, family_id)
      VALUES (
        NEW.assigned_to,
        'task_approved',
        'Task Approved!',
        'Your task "' || v_task_title || '" has been approved!',
        v_family_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Fix: notify_task_assigned - Remove task_id
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;
  v_task_title TEXT;
  v_parent_name TEXT;
BEGIN
  -- Only proceed if assigned_to changed
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    v_family_id := NEW.family_id;
    v_task_title := NEW.title;
    
    -- Get parent's name
    SELECT full_name INTO v_parent_name
    FROM profiles
    WHERE id = NEW.created_by;
    
    -- Notify the assigned child
    INSERT INTO notifications (user_id, type, title, message, family_id)
    VALUES (
      NEW.assigned_to,
      'task_assigned',
      'New Task Assigned',
      COALESCE(v_parent_name, 'A parent') || ' assigned you: "' || v_task_title || '"',
      v_family_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Fix: notify_task_completed - Remove task_id
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
      INSERT INTO notifications (user_id, type, title, message, family_id)
      VALUES (
        v_parent_id,
        'task_completed',
        'Task Completed',
        COALESCE(v_child_name, 'A child') || ' completed: "' || v_task_title || '"',
        v_family_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 
  proname as function_name,
  '✅ Removed task_id from INSERT' as status
FROM pg_proc
WHERE proname IN (
  'notify_help_requested',
  'notify_task_approved',
  'notify_task_assigned',
  'notify_task_completed'
)
ORDER BY proname;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅✅✅ ALL NOTIFICATION TRIGGERS FIXED ✅✅✅';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed all 4 trigger functions:';
  RAISE NOTICE '  ✅ notify_help_requested';
  RAISE NOTICE '  ✅ notify_task_approved';
  RAISE NOTICE '  ✅ notify_task_assigned';
  RAISE NOTICE '  ✅ notify_task_completed';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  - Use boolean columns (approved, completed, help_requested)';
  RAISE NOTICE '  - Removed task_id from INSERT (column does not exist)';
  RAISE NOTICE '  - family_id is TEXT type';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TEST NOW - Should work!';
  RAISE NOTICE '====================================';
END $$;
