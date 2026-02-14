-- ============================================================================
-- FIX PHOTO UPLOAD AND ACTIVITY FEED ISSUES
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING PHOTO COLUMNS TO TASKS TABLE
-- ============================================================================

-- Add photo_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE tasks ADD COLUMN photo_url TEXT;
    RAISE NOTICE '✅ Added photo_url column to tasks table';
  ELSE
    RAISE NOTICE 'ℹ️  photo_url column already exists';
  END IF;
END $$;

-- Add photo_uploaded_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'tasks' 
    AND column_name = 'photo_uploaded_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN photo_uploaded_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added photo_uploaded_at column to tasks table';
  ELSE
    RAISE NOTICE 'ℹ️  photo_uploaded_at column already exists';
  END IF;
END $$;

-- ============================================================================
-- 2. FIX ACTIVITY FEED TRIGGERS TO HANDLE NULL FAMILY_ID
-- ============================================================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS task_completion_activity_trigger ON tasks;
DROP TRIGGER IF EXISTS task_approval_activity_trigger ON tasks;
DROP TRIGGER IF EXISTS achievement_earned_activity_trigger ON user_achievements;

-- Fixed function for task completion activity
CREATE OR REPLACE FUNCTION create_task_completion_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
BEGIN
  -- Only create activity when task is marked as completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Get family_id and user details
    -- CAST: profiles.family_id (UUID) to TEXT
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;

    -- Only proceed if we have a valid family_id
    IF v_family_id IS NOT NULL THEN
      -- Verify family exists in families table
      IF EXISTS (SELECT 1 FROM families WHERE id = v_family_id) THEN
        -- Get task details
        v_task_title := NEW.title;
        v_points := NEW.points;

        -- Insert activity
        INSERT INTO activity_feed (
          family_id,
          user_id,
          activity_type,
          title,
          description,
          metadata
        ) VALUES (
          v_family_id,
          NEW.assigned_to,
          'task_completed',
          COALESCE(v_user_name, 'User') || ' completed a task!',
          'Completed: ' || v_task_title,
          jsonb_build_object(
            'task_id', NEW.id,
            'task_title', v_task_title,
            'points_earned', v_points
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the task update
    RAISE WARNING 'Failed to create task completion activity: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fixed function for task approval activity
CREATE OR REPLACE FUNCTION create_task_approval_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
BEGIN
  -- Only create activity when task is approved (not just completed)
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    -- Get family_id and user details
    -- CAST: profiles.family_id (UUID) to TEXT
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;

    -- Only proceed if we have a valid family_id
    IF v_family_id IS NOT NULL THEN
      -- Verify family exists in families table
      IF EXISTS (SELECT 1 FROM families WHERE id = v_family_id) THEN
        -- Get task details
        v_task_title := NEW.title;
        v_points := NEW.points;

        -- Insert activity
        INSERT INTO activity_feed (
          family_id,
          user_id,
          activity_type,
          title,
          description,
          metadata
        ) VALUES (
          v_family_id,
          NEW.assigned_to,
          'task_approved',
          'Task Approved: ' || v_task_title,
          COALESCE(v_user_name, 'User') || ' earned ' || v_points || ' points!',
          jsonb_build_object(
            'task_id', NEW.id,
            'task_title', v_task_title,
            'points_earned', v_points
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the task update
    RAISE WARNING 'Failed to create task approval activity: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fixed function for achievement earned activity
CREATE OR REPLACE FUNCTION create_achievement_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_achievement_title TEXT;
  v_achievement_icon TEXT;
BEGIN
  -- Only create activity for new achievements
  IF TG_OP = 'INSERT' THEN
    -- Get family_id and user details
    -- CAST: profiles.family_id (UUID) to TEXT
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.user_id;

    -- Only proceed if we have a valid family_id
    IF v_family_id IS NOT NULL THEN
      -- Verify family exists in families table
      IF EXISTS (SELECT 1 FROM families WHERE id = v_family_id) THEN
        -- Get achievement details
        SELECT title, icon INTO v_achievement_title, v_achievement_icon
        FROM achievements
        WHERE id = NEW.achievement_id;

        -- Insert activity
        INSERT INTO activity_feed (
          family_id,
          user_id,
          activity_type,
          title,
          description,
          metadata
        ) VALUES (
          v_family_id,
          NEW.user_id,
          'achievement_earned',
          COALESCE(v_user_name, 'User') || ' unlocked an achievement!',
          '🏆 ' || v_achievement_title,
          jsonb_build_object(
            'achievement_id', NEW.achievement_id,
            'achievement_title', v_achievement_title,
            'achievement_icon', v_achievement_icon
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the achievement unlock
    RAISE WARNING 'Failed to create achievement activity: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER task_completion_activity_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_completion_activity();

CREATE TRIGGER task_approval_activity_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_approval_activity();

CREATE TRIGGER achievement_earned_activity_trigger
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION create_achievement_activity();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ All fixes applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '  1. Added photo_url and photo_uploaded_at columns to tasks table';
  RAISE NOTICE '  2. Fixed activity feed triggers to handle NULL family_id';
  RAISE NOTICE '  3. Added error handling to prevent trigger failures';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '  • Upload photos with task completion';
  RAISE NOTICE '  • Skip photo upload without errors';
  RAISE NOTICE '  • Complete tasks without foreign key violations';
  RAISE NOTICE '';
END $$;
