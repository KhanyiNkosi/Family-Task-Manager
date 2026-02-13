-- Fix Activity Feed Foreign Key Constraint Violation
-- Problem: Triggers try to insert into activity_feed with family_id that doesn't exist in families table
-- Solution: Make triggers check if family exists before inserting AND fix orphaned family references

-- ============================================================================
-- PART 1: Fix Missing Families (Immediate Fix)
-- ============================================================================

-- Step 1: Identify profiles with missing families
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM profiles p
  LEFT JOIN families f ON p.family_id = f.id
  WHERE p.family_id IS NOT NULL AND f.id IS NULL;
  
  RAISE NOTICE 'Found % profiles with missing family references', missing_count;
END $$;

-- Step 2: Create missing family records automatically
INSERT INTO families (id, family_code, created_at, created_by)
SELECT DISTINCT 
  p.family_id,
  -- Generate 8-character unique code from UUID
  UPPER(SUBSTRING(REPLACE(p.family_id::text, '-', '') FROM 1 FOR 8)),
  NOW(),
  -- Use first parent in that family as creator, or first user if no parent
  COALESCE(
    (SELECT id FROM profiles WHERE family_id = p.family_id AND role = 'parent' LIMIT 1),
    (SELECT id FROM profiles WHERE family_id = p.family_id LIMIT 1)
  )
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id IS NOT NULL 
  AND f.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify the fix
SELECT 
  'Verification Results' as status,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN p.family_id IS NOT NULL THEN 1 END) as profiles_with_family,
  COUNT(CASE WHEN p.family_id IS NOT NULL AND f.id IS NULL THEN 1 END) as still_orphaned
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id;

-- ============================================================================
-- PART 2: Make Activity Feed Triggers Resilient (Prevent Future Issues)
-- ============================================================================

-- Updated task completion trigger function - with family existence check
CREATE OR REPLACE FUNCTION create_task_completion_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
  v_family_exists BOOLEAN;
BEGIN
  -- Only create activity when task is completed (not approved yet)
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    -- Get family_id and user details
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;

    -- Check if family exists before attempting insert
    IF v_family_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM families WHERE id = v_family_id::uuid) INTO v_family_exists;
      
      IF NOT v_family_exists THEN
        RAISE WARNING 'Skipping activity feed insert: family_id % does not exist in families table for user %', 
          v_family_id, NEW.assigned_to;
        RETURN NEW;
      END IF;
    ELSE
      RAISE WARNING 'Skipping activity feed insert: user % has no family_id', NEW.assigned_to;
      RETURN NEW;
    END IF;

    -- Get task details
    v_task_title := NEW.title;
    v_points := NEW.points;

    -- Insert activity (only if family exists)
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
      v_user_name || ' completed a task!',
      'Completed: ' || v_task_title,
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', v_task_title,
        'points_earned', v_points
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE WARNING 'Cannot create activity feed: family_id % not found in families table', v_family_id;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating activity feed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated task approval trigger function - with family existence check
CREATE OR REPLACE FUNCTION create_task_approval_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_parent_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
  v_family_exists BOOLEAN;
BEGIN
  -- Only create activity when task is approved
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    -- Get family_id and user details
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;

    -- Check if family exists before attempting insert
    IF v_family_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM families WHERE id = v_family_id::uuid) INTO v_family_exists;
      
      IF NOT v_family_exists THEN
        RAISE WARNING 'Skipping activity feed insert: family_id % does not exist', v_family_id;
        RETURN NEW;
      END IF;
    ELSE
      RAISE WARNING 'Skipping activity feed insert: user % has no family_id', NEW.assigned_to;
      RETURN NEW;
    END IF;

    -- Get parent name
    SELECT full_name INTO v_parent_name
    FROM profiles
    WHERE id = NEW.created_by;

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
      NEW.created_by,
      'task_approved',
      v_parent_name || ' approved ' || v_user_name || '''s task!',
      v_user_name || ' earned ' || v_points || ' points for: ' || v_task_title,
      jsonb_build_object(
        'task_id', NEW.id,
        'task_title', v_task_title,
        'points_earned', v_points,
        'child_id', NEW.assigned_to,
        'child_name', v_user_name
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE WARNING 'Cannot create activity feed: family_id % not found', v_family_id;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating activity feed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated achievement trigger function - with family existence check
CREATE OR REPLACE FUNCTION create_achievement_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_achievement_title TEXT;
  v_achievement_icon TEXT;
  v_family_exists BOOLEAN;
BEGIN
  -- Only create activity when achievement is earned
  IF NEW.is_earned = true AND (OLD.is_earned IS NULL OR OLD.is_earned = false) THEN
    -- Get user details
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.user_id;

    -- Check if family exists before attempting insert
    IF v_family_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM families WHERE id = v_family_id::uuid) INTO v_family_exists;
      
      IF NOT v_family_exists THEN
        RAISE WARNING 'Skipping activity feed insert: family_id % does not exist', v_family_id;
        RETURN NEW;
      END IF;
    ELSE
      RAISE WARNING 'Skipping activity feed insert: user % has no family_id', NEW.user_id;
      RETURN NEW;
    END IF;

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
      '🏆 ' || v_user_name || ' earned a badge!',
      'Unlocked: ' || v_achievement_title,
      jsonb_build_object(
        'achievement_id', NEW.achievement_id,
        'achievement_title', v_achievement_title,
        'achievement_icon', v_achievement_icon
      )
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN foreign_key_violation THEN
    RAISE WARNING 'Cannot create activity feed: family_id % not found', v_family_id;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating activity feed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: Verification
-- ============================================================================

-- Check specific family from error logs
SELECT 
  'Checking Family 519e50cd-5459-4ade-936a-671ea9bea488' as check_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM families WHERE id = '519e50cd-5459-4ade-936a-671ea9bea488') 
    THEN '✅ FIXED - Family now exists'
    ELSE '❌ STILL MISSING - Run Part 1 again'
  END as status;

-- Summary report
SELECT 
  '📊 Final Status Report' as report,
  (SELECT COUNT(*) FROM families) as total_families,
  (SELECT COUNT(DISTINCT family_id) FROM profiles WHERE family_id IS NOT NULL) as unique_family_refs,
  (SELECT COUNT(*) FROM profiles p WHERE p.family_id IS NOT NULL 
   AND NOT EXISTS(SELECT 1 FROM families f WHERE f.id = p.family_id)) as orphaned_profiles;
