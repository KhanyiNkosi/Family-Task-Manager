-- ============================================================================
-- FIX: Parent Lookup Cannot Access auth.users
-- ============================================================================
-- 
-- PROBLEM: Triggers can't query auth.users even with SECURITY DEFINER
-- SOLUTION: Create dedicated SECURITY DEFINER functions for user lookups
-- ============================================================================

-- ============================================================================
-- STEP 1: Create secure lookup functions
-- ============================================================================

-- Get parent ID for a family
CREATE OR REPLACE FUNCTION get_parent_id_for_family(p_family_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_parent_id UUID;
BEGIN
  SELECT id INTO v_parent_id
  FROM auth.users
  WHERE raw_user_meta_data->>'family_code' = p_family_id::TEXT
    AND raw_user_meta_data->>'role' = 'parent'
  LIMIT 1;
  
  RETURN v_parent_id;
END;
$$;

-- Get user name from auth.users
CREATE OR REPLACE FUNCTION get_user_name(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT raw_user_meta_data->>'name' INTO v_name
  FROM auth.users
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_name, 'User');
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_parent_id_for_family TO authenticated;
GRANT EXECUTE ON FUNCTION get_parent_id_for_family TO service_role;
GRANT EXECUTE ON FUNCTION get_user_name TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_name TO service_role;

-- ============================================================================
-- STEP 2: Update triggers to use lookup functions
-- ============================================================================

-- TASK COMPLETION TRIGGER (Fixed)
CREATE OR REPLACE FUNCTION notify_task_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_child_name TEXT;
BEGIN
  IF NEW.completed = TRUE AND (OLD IS NULL OR OLD.completed IS DISTINCT FROM TRUE) THEN
    
    -- Use secure lookup functions
    v_parent_id := get_parent_id_for_family(NEW.family_id);
    v_child_name := get_user_name(NEW.assigned_to);
    
    IF v_parent_id IS NOT NULL THEN
      PERFORM create_notification(
        v_parent_id,
        NEW.family_id::TEXT,
        'Task Completed!',
        v_child_name || ' completed "' || NEW.title || '" and earned ' || NEW.points || ' points',
        'success',
        '/parent-dashboard',
        'Review Task'
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_task_completed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- HELP REQUEST TRIGGER (Fixed)
CREATE OR REPLACE FUNCTION notify_help_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_child_name TEXT;
BEGIN
  IF NEW.help_requested = TRUE AND (OLD IS NULL OR OLD.help_requested IS DISTINCT FROM TRUE) THEN
    
    -- Use secure lookup functions
    v_parent_id := get_parent_id_for_family(NEW.family_id);
    v_child_name := get_user_name(NEW.assigned_to);
    
    IF v_parent_id IS NOT NULL THEN
      PERFORM create_notification(
        v_parent_id,
        NEW.family_id::TEXT,
        'Help Requested',
        v_child_name || ' needs help with "' || NEW.title || '"' ||
        CASE 
          WHEN NEW.help_message IS NOT NULL AND NEW.help_message != '' THEN ': ' || NEW.help_message
          ELSE ''
        END,
        'warning',
        '/parent-dashboard',
        'View Task'
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_help_requested: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- REWARD REQUEST TRIGGER (Fixed)
CREATE OR REPLACE FUNCTION notify_reward_requested()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID;
  v_family_id TEXT;
  v_child_name TEXT;
  v_reward_title TEXT;
  v_points INTEGER;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    
    SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
    FROM rewards
    WHERE id = NEW.reward_id;
    
    -- Use secure lookup functions
    v_child_name := get_user_name(NEW.user_id);
    v_parent_id := get_parent_id_for_family(v_family_id::UUID);
    
    IF v_parent_id IS NOT NULL THEN
      PERFORM create_notification(
        v_parent_id,
        v_family_id,
        'Reward Request',
        v_child_name || ' requested "' || v_reward_title || '" (' || v_points || ' points)',
        'reward',
        '/parent-dashboard',
        'Review Request'
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in notify_reward_requested: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ PARENT LOOKUP FIX APPLIED!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  ✅ Created get_parent_id_for_family function';
  RAISE NOTICE '  ✅ Created get_user_name function';
  RAISE NOTICE '  ✅ Updated 3 triggers to use lookup functions';
  RAISE NOTICE '  ✅ Functions have SET search_path = public, auth';
  RAISE NOTICE '';
  RAISE NOTICE 'This allows triggers to access auth.users data securely.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test task completion in your app!';
  RAISE NOTICE '';
END $$;
