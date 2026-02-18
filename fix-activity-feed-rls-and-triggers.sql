-- ============================================================================
-- FIX ACTIVITY FEED RLS POLICY AND TRIGGER ISSUES
-- ============================================================================
-- Error: "new row violates row-level security policy for table 'activity_feed'"
-- Solution: Fix RLS policies and ensure triggers use SECURITY DEFINER

-- ============================================================================
-- STEP 1: Drop existing problematic policies
-- ============================================================================
DROP POLICY IF EXISTS "Users create activities" ON activity_feed;
DROP POLICY IF EXISTS "Family members view own family feed" ON activity_feed;
DROP POLICY IF EXISTS "Parents update activities" ON activity_feed;
DROP POLICY IF EXISTS "Parents delete activities" ON activity_feed;

-- ============================================================================
-- STEP 2: Create proper RLS policies for activity_feed
-- ============================================================================

-- Policy: Family members can view their family's activity feed
CREATE POLICY "Family members view own family feed"
  ON activity_feed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.family_id = activity_feed.family_id
    )
  );

-- Policy: Allow inserts from authenticated users (including triggers running as user)
-- This is crucial - triggers run in the context of the user, so they need INSERT permission
CREATE POLICY "Allow activity feed inserts"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is in the same family as the activity
    -- Note: In WITH CHECK, use column name directly, not table.column
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.family_id = family_id
    )
    OR
    -- Allow if user is the one performing the activity
    user_id = auth.uid()
  );

-- Policy: Parents can update activities (pin/unpin)
CREATE POLICY "Parents update activities"
  ON activity_feed FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
      AND profiles.family_id = activity_feed.family_id
    )
  );

-- Policy: Parents can delete activities
CREATE POLICY "Parents delete activities"
  ON activity_feed FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
      AND profiles.family_id = activity_feed.family_id
    )
  );

-- ============================================================================
-- STEP 3: Recreate trigger functions with SECURITY DEFINER
-- ============================================================================

-- Function to create activity when task is approved
CREATE OR REPLACE FUNCTION create_task_approval_activity()
RETURNS TRIGGER
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_family_id UUID;
  v_user_name TEXT;
  v_task_title TEXT;
  v_points INT;
BEGIN
  -- Only proceed if task was just approved (transitioned from false/null to true)
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    
    -- Get family_id from the task
    v_family_id := NEW.family_id;
    
    -- Get user name from profiles
    SELECT full_name INTO v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;
    
    v_user_name := COALESCE(v_user_name, 'A family member');
    v_task_title := NEW.title;
    v_points := NEW.points;
    
    -- Insert activity into feed
    INSERT INTO activity_feed (
      family_id,
      user_id,
      activity_type,
      title,
      description,
      metadata,
      created_at
    ) VALUES (
      v_family_id,
      NEW.assigned_to,
      'task_approved',
      '✅ ' || v_user_name || ' completed a task!',
      'Task: ' || v_task_title,
      jsonb_build_object(
        'task_id', NEW.id,
        'points', v_points,
        'task_title', v_task_title
      ),
      NOW()
    );
    
    RAISE NOTICE '✅ Activity feed entry created for approved task: %', v_task_title;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create activity when task is completed (but not yet approved)
CREATE OR REPLACE FUNCTION create_task_completion_activity()
RETURNS TRIGGER
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_family_id UUID;
  v_user_name TEXT;
  v_task_title TEXT;
  v_points INT;
BEGIN
  -- Only proceed if task was just completed (not approved yet)
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) AND NEW.approved = false THEN
    
    v_family_id := NEW.family_id;
    
    SELECT full_name INTO v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;
    
    v_user_name := COALESCE(v_user_name, 'A family member');
    v_task_title := NEW.title;
    v_points := NEW.points;
    
    INSERT INTO activity_feed (
      family_id,
      user_id,
      activity_type,
      title,
      description,
      metadata,
      created_at
    ) VALUES (
      v_family_id,
      NEW.assigned_to,
      'task_completed',
      '📝 ' || v_user_name || ' completed a task!',
      'Waiting for approval: ' || v_task_title,
      jsonb_build_object(
        'task_id', NEW.id,
        'points', v_points,
        'task_title', v_task_title,
        'status', 'pending_approval'
      ),
      NOW()
    );
    
    RAISE NOTICE '✅ Activity feed entry created for completed task: %', v_task_title;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: Drop and recreate triggers
-- ============================================================================

DROP TRIGGER IF EXISTS task_approval_activity_trigger ON tasks;
CREATE TRIGGER task_approval_activity_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_approval_activity();

DROP TRIGGER IF EXISTS task_completion_activity_trigger ON tasks;
CREATE TRIGGER task_completion_activity_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_completion_activity();

-- ============================================================================
-- STEP 5: Verify the fix
-- ============================================================================

-- Show all policies
SELECT 
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'USING clause exists' ELSE 'No USING' END as using_check,
  CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK exists' ELSE 'No WITH CHECK' END as with_check_status
FROM pg_policies
WHERE tablename = 'activity_feed'
ORDER BY cmd, policyname;

-- Show all triggers on tasks table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'tasks'
  AND trigger_name LIKE '%activity%'
ORDER BY trigger_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ ACTIVITY FEED FIX COMPLETE!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed issues:';
  RAISE NOTICE '   1. RLS policies now allow trigger inserts';
  RAISE NOTICE '   2. Trigger functions use SECURITY DEFINER';
  RAISE NOTICE '   3. Activity feed will update on task approval';
  RAISE NOTICE '   4. Activity feed will update on task completion';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  TEST: Approve a task to verify activity feed updates!';
  RAISE NOTICE '';
END $$;
