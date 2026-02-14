-- ============================================================================
-- Fix Trigger Functions: Change v_family_id from UUID to TEXT
-- ============================================================================
-- This fixes the type mismatch in task notification triggers
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Fixing trigger functions...';
END $$;

-- ============================================================================
-- Fix 1: notify_help_requested
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_help_requested()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;  -- Changed from UUID to TEXT
  v_parent_id UUID;
  v_child_name TEXT;
  v_task_title TEXT;
BEGIN
  -- Only proceed if help is being requested
  IF NEW.help_requested = TRUE AND (OLD.help_requested IS NULL OR OLD.help_requested = FALSE) THEN
    v_family_id := NEW.family_id;  -- TEXT assignment
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
      WHERE p.family_id = v_family_id  -- Both TEXT
        AND up.role = 'parent'
    LOOP
      INSERT INTO notifications (user_id, type, title, message, family_id, task_id)
      VALUES (
        v_parent_id,
        'help_request',
        'Help Requested',
        COALESCE(v_child_name, 'A child') || ' needs help with "' || v_task_title || '"',
        v_family_id,  -- TEXT
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed notify_help_requested';
END $$;

-- ============================================================================
-- Fix 2: notify_task_approved
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_task_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;  -- Changed from UUID to TEXT
  v_task_title TEXT;
BEGIN
  -- Only proceed if status changed to approved
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    v_family_id := NEW.family_id;  -- TEXT assignment
    v_task_title := NEW.title;
    
    -- Notify the child who completed the task
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, family_id, task_id)
      VALUES (
        NEW.assigned_to,
        'task_approved',
        'Task Approved!',
        'Your task "' || v_task_title || '" has been approved!',
        v_family_id,  -- TEXT
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed notify_task_approved';
END $$;

-- ============================================================================
-- Fix 3: notify_task_assigned
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;  -- Changed from UUID to TEXT
  v_task_title TEXT;
  v_parent_name TEXT;
BEGIN
  -- Only proceed if assigned_to changed
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    v_family_id := NEW.family_id;  -- TEXT assignment
    v_task_title := NEW.title;
    
    -- Get parent's name
    SELECT full_name INTO v_parent_name
    FROM profiles
    WHERE id = NEW.created_by;
    
    -- Notify the assigned child
    INSERT INTO notifications (user_id, type, title, message, family_id, task_id)
    VALUES (
      NEW.assigned_to,
      'task_assigned',
      'New Task Assigned',
      COALESCE(v_parent_name, 'A parent') || ' assigned you: "' || v_task_title || '"',
      v_family_id,  -- TEXT
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed notify_task_assigned';
END $$;

-- ============================================================================
-- Fix 4: notify_task_completed
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_family_id TEXT;  -- Changed from UUID to TEXT
  v_parent_id UUID;
  v_task_title TEXT;
  v_child_name TEXT;
BEGIN
  -- Only proceed if status changed to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    v_family_id := NEW.family_id;  -- TEXT assignment
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
      WHERE p.family_id = v_family_id  -- Both TEXT
        AND up.role = 'parent'
    LOOP
      INSERT INTO notifications (user_id, type, title, message, family_id, task_id)
      VALUES (
        v_parent_id,
        'task_completed',
        'Task Completed',
        COALESCE(v_child_name, 'A child') || ' completed: "' || v_task_title || '"',
        v_family_id,  -- TEXT
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed notify_task_completed';
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 
  'Trigger Functions Fixed' as status,
  proname as function_name,
  '✅ Recreated with TEXT' as fixed
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
  RAISE NOTICE '✅✅✅ ALL TRIGGERS FIXED! ✅✅✅';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed 4 trigger functions:';
  RAISE NOTICE '  ✅ notify_help_requested';
  RAISE NOTICE '  ✅ notify_task_approved';
  RAISE NOTICE '  ✅ notify_task_assigned';
  RAISE NOTICE '  ✅ notify_task_completed';
  RAISE NOTICE '';
  RAISE NOTICE 'Changed v_family_id from UUID to TEXT';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'TEST NOW:';
  RAISE NOTICE '  1. Refresh browser';
  RAISE NOTICE '  2. Complete a task';
  RAISE NOTICE '  3. Should work without errors!';
  RAISE NOTICE '====================================';
END $$;
