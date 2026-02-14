-- Create Activity Feed System for FamilyTask
-- VERSION 3: Idempotent with DROP POLICY IF EXISTS
-- Safe to run multiple times - will update existing objects
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. ACTIVITY_FEED TABLE (Central activity log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'task_completed', 'task_approved', 'reward_redeemed', 'achievement_earned', 'level_up', 'streak_milestone', 'announcement', 'birthday'
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Store additional data like task_id, points_earned, etc.
  image_url TEXT, -- Optional: photo verification or celebration image
  is_pinned BOOLEAN DEFAULT false, -- Parents can pin important announcements
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first, then recreate
DROP POLICY IF EXISTS "Family members view own family feed" ON activity_feed;
CREATE POLICY "Family members view own family feed"
  ON activity_feed FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.family_id::text = activity_feed.family_id
    )
  );

DROP POLICY IF EXISTS "Users create activities" ON activity_feed;
CREATE POLICY "Users create activities"
  ON activity_feed FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
      AND profiles.family_id::text = activity_feed.family_id
    )
  );

DROP POLICY IF EXISTS "Parents update activities" ON activity_feed;
CREATE POLICY "Parents update activities"
  ON activity_feed FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
      AND profiles.family_id::text = activity_feed.family_id
    )
  );

DROP POLICY IF EXISTS "Parents delete activities" ON activity_feed;
CREATE POLICY "Parents delete activities"
  ON activity_feed FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
      AND profiles.family_id::text = activity_feed.family_id
    )
  );

-- ============================================================================
-- 2. ACTIVITY_REACTIONS TABLE (Likes/Reactions to activities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like', -- 'like', 'love', 'celebrate', 'wow', 'fire'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, user_id) -- One reaction per user per activity
);

-- Enable RLS
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first, then recreate
DROP POLICY IF EXISTS "Family members view reactions" ON activity_reactions;
CREATE POLICY "Family members view reactions"
  ON activity_reactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_feed af
      JOIN profiles p ON p.family_id::text = af.family_id
      WHERE af.id = activity_reactions.activity_id
      AND p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users add reactions" ON activity_reactions;
CREATE POLICY "Users add reactions"
  ON activity_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users remove reactions" ON activity_reactions;
CREATE POLICY "Users remove reactions"
  ON activity_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 3. ACTIVITY_COMMENTS TABLE (Comments on activities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first, then recreate
DROP POLICY IF EXISTS "Family members view comments" ON activity_comments;
CREATE POLICY "Family members view comments"
  ON activity_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM activity_feed af
      JOIN profiles p ON p.family_id::text = af.family_id
      WHERE af.id = activity_comments.activity_id
      AND p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users add comments" ON activity_comments;
CREATE POLICY "Users add comments"
  ON activity_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users edit own comments" ON activity_comments;
CREATE POLICY "Users edit own comments"
  ON activity_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete own comments or parents delete any" ON activity_comments;
CREATE POLICY "Users delete own comments or parents delete any"
  ON activity_comments FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      JOIN activity_feed af ON af.family_id = profiles.family_id::text
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'parent'
      AND af.id = activity_comments.activity_id
    )
  );

-- ============================================================================
-- 4. HELPER FUNCTIONS (CREATE OR REPLACE is already idempotent)
-- ============================================================================

-- Function to create activity when task is completed
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity when task is approved
CREATE OR REPLACE FUNCTION create_task_approval_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_parent_name TEXT;
  v_task_title TEXT;
  v_points INTEGER;
BEGIN
  -- Only create activity when task is approved
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    -- Get family_id and user details
    -- CAST: profiles.family_id (UUID) to TEXT
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.assigned_to;

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity when achievement is earned
CREATE OR REPLACE FUNCTION create_achievement_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_user_name TEXT;
  v_achievement_title TEXT;
  v_achievement_icon TEXT;
BEGIN
  -- Only create activity when achievement is earned
  IF NEW.is_earned = true AND (OLD.is_earned IS NULL OR OLD.is_earned = false) THEN
    -- Get user details
    -- CAST: profiles.family_id (UUID) to TEXT
    SELECT family_id::text, full_name INTO v_family_id, v_user_name
    FROM profiles
    WHERE id = NEW.user_id;

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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. TRIGGERS (DROP IF EXISTS + CREATE is already idempotent)
-- ============================================================================

-- Trigger for task completion activity
DROP TRIGGER IF EXISTS task_completion_activity_trigger ON tasks;
CREATE TRIGGER task_completion_activity_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_completion_activity();

-- Trigger for task approval activity
DROP TRIGGER IF EXISTS task_approval_activity_trigger ON tasks;
CREATE TRIGGER task_approval_activity_trigger
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION create_task_approval_activity();

-- Trigger for achievement earned activity
DROP TRIGGER IF EXISTS achievement_earned_activity_trigger ON user_achievements;
CREATE TRIGGER achievement_earned_activity_trigger
  AFTER UPDATE ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION create_achievement_activity();

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE (CREATE IF NOT EXISTS is idempotent)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_activity_feed_family_id ON activity_feed(family_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity_id ON activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);

-- ============================================================================
-- 7. VIEW FOR ACTIVITY FEED WITH REACTIONS COUNT
-- ============================================================================
DROP VIEW IF EXISTS activity_feed_with_stats;
CREATE VIEW activity_feed_with_stats AS
SELECT 
  af.*,
  p.full_name as user_name,
  p.role as user_role,
  COALESCE(reaction_counts.total_reactions, 0) as reaction_count,
  COALESCE(comment_counts.total_comments, 0) as comment_count
FROM activity_feed af
JOIN profiles p ON p.id = af.user_id
LEFT JOIN (
  SELECT activity_id, COUNT(*) as total_reactions
  FROM activity_reactions
  GROUP BY activity_id
) reaction_counts ON reaction_counts.activity_id = af.id
LEFT JOIN (
  SELECT activity_id, COUNT(*) as total_comments
  FROM activity_comments
  GROUP BY activity_id
) comment_counts ON comment_counts.activity_id = af.id
ORDER BY af.is_pinned DESC, af.created_at DESC;

-- Grant access to view
GRANT SELECT ON activity_feed_with_stats TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '📰 Activity Feed system created/updated successfully!';
  RAISE NOTICE '✅ Tables: activity_feed, activity_reactions, activity_comments';
  RAISE NOTICE '🔒 RLS policies: Updated with UUID→TEXT casts for family_id';
  RAISE NOTICE '⚡ Triggers: Created for automatic activity logging';
  RAISE NOTICE '🛡️  Functions: Added SECURITY DEFINER for RLS bypass';
  RAISE NOTICE '📊 View: activity_feed_with_stats';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  NOTE: This script is IDEMPOTENT - safe to run multiple times';
  RAISE NOTICE '    Existing policies, triggers, and views are dropped and recreated';
  RAISE NOTICE '';
  RAISE NOTICE 'Activity types supported:';
  RAISE NOTICE '  • task_completed - When child completes a task';
  RAISE NOTICE '  • task_approved - When parent approves a task';
  RAISE NOTICE '  • achievement_earned - When user earns a badge';
  RAISE NOTICE '  • reward_redeemed - When child redeems a reward';
  RAISE NOTICE '  • level_up - When user levels up';
  RAISE NOTICE '  • announcement - Parent announcements';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Ready to test: Approve a task to see activity feed populate!';
END $$;
