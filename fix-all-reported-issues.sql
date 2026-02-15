-- ============================================================================
-- FIX ALL REPORTED ISSUES
-- ============================================================================
-- 1. Fix bulletin message UUID error
-- 2. Fix reward notification to notify both parent and child
-- 3. Add 3 default free rewards
-- 4. Activity feed reactions fix (handled in RLS policies)
-- ============================================================================

-- ============================================================================
-- ISSUE 1: FIX BULLETIN MESSAGES TABLE - Change family_id to TEXT
-- ============================================================================
-- Must drop ALL RLS policies first, then alter column, then recreate ALL policies

-- Show existing policies for reference
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== Current bulletin_messages policies ===';
  FOR policy_record IN 
    SELECT policyname, cmd FROM pg_policies WHERE tablename = 'bulletin_messages'
  LOOP
    RAISE NOTICE 'Policy: %, Command: %', policy_record.policyname, policy_record.cmd;
  END LOOP;
END $$;

-- Step 1: Drop ALL RLS policies on bulletin_messages (to avoid any family_id column dependency)
DROP POLICY IF EXISTS "Users can view their family bulletin messages" ON bulletin_messages;
DROP POLICY IF EXISTS "Users can create family bulletin messages" ON bulletin_messages;
DROP POLICY IF EXISTS "Users can update family bulletin messages" ON bulletin_messages;
DROP POLICY IF EXISTS "Users can delete family bulletin messages" ON bulletin_messages;
DROP POLICY IF EXISTS "family_view_bulletin_messages" ON bulletin_messages;
DROP POLICY IF EXISTS "family_create_bulletin_messages" ON bulletin_messages;
DROP POLICY IF EXISTS "family_update_bulletin_messages" ON bulletin_messages;
DROP POLICY IF EXISTS "family_delete_bulletin_messages" ON bulletin_messages;

-- Step 2: Alter the column type from UUID to TEXT
ALTER TABLE bulletin_messages 
ALTER COLUMN family_id TYPE TEXT;

-- Step 3: Recreate ALL RLS policies with TEXT column references
-- Policy 1: SELECT - Users can view their family bulletin messages
CREATE POLICY "Users can view their family bulletin messages"
  ON bulletin_messages FOR SELECT
  USING (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy 2: INSERT - Users can create family bulletin messages
CREATE POLICY "Users can create family bulletin messages"
  ON bulletin_messages FOR INSERT
  WITH CHECK (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy 3: UPDATE - Users can update their own family bulletin messages
CREATE POLICY "Users can update family bulletin messages"
  ON bulletin_messages FOR UPDATE
  USING (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy 4: DELETE - Users can delete their own family bulletin messages
CREATE POLICY "Users can delete family bulletin messages"
  ON bulletin_messages FOR DELETE
  USING (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Step 5: Fix the notify_bulletin_message trigger function (change v_family_id from UUID to TEXT)
CREATE OR REPLACE FUNCTION notify_bulletin_message()
RETURNS TRIGGER AS $$
DECLARE
  v_poster_name TEXT;
  v_family_id TEXT;  -- ✅ Changed from UUID to TEXT to match bulletin_messages.family_id
  v_member RECORD;
BEGIN
  -- Only trigger on new bulletin message
  IF TG_OP = 'INSERT' THEN
    
    v_family_id := NEW.family_id;
    
    -- Get poster's name from profiles table
    SELECT full_name INTO v_poster_name
    FROM profiles
    WHERE id = NEW.posted_by;
    
    -- Notify all family members except the poster
    FOR v_member IN 
      SELECT p.id 
      FROM profiles p
      WHERE p.family_id = v_family_id
        AND p.id != NEW.posted_by
    LOOP
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        v_member.id,
        v_family_id,
        'New Family Message',
        COALESCE(v_poster_name, 'A family member') || ' posted: "' || 
        CASE 
          WHEN LENGTH(NEW.message) > 100 THEN SUBSTRING(NEW.message, 1, 100) || '...'
          ELSE NEW.message
        END || '"',
        'info',
        '/parent-dashboard',
        'View Bulletin'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ISSUE 2: UPDATE REWARD NOTIFICATION TO NOTIFY PARENT TOO
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_reward_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_family_id TEXT;
  v_reward_title TEXT;
  v_points INTEGER;
  v_parent_id UUID;
  v_child_name TEXT;
BEGIN
  -- Only trigger when status changes from 'pending' to 'approved' or 'rejected'
  IF (OLD.status = 'pending' OR OLD.status = 'requested') AND NEW.status IN ('approved', 'rejected') THEN
    
    -- Get reward details
    SELECT title, points_cost, family_id INTO v_reward_title, v_points, v_family_id
    FROM rewards
    WHERE id = NEW.reward_id;
    
    -- Get child's name
    SELECT full_name INTO v_child_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Find parent in the family
    SELECT p.id INTO v_parent_id
    FROM profiles p
    JOIN user_profiles up ON up.id = p.id
    WHERE p.family_id = v_family_id
      AND up.role = 'parent'
    LIMIT 1;
    
    -- Create notification for CHILD
    IF NEW.status = 'approved' THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        NEW.user_id,
        v_family_id,
        'Reward Approved! 🎁',
        'Your reward "' || v_reward_title || '" has been approved! Enjoy!',
        'success',
        '/child-dashboard',
        'View Rewards'
      );
      
      -- ALSO notify PARENT of approval
      IF v_parent_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
        VALUES (
          v_parent_id,
          v_family_id,
          'Reward Approved ✅',
          'You approved "' || v_reward_title || '" for ' || COALESCE(v_child_name, 'child') || ' (' || v_points || ' points)',
          'info',
          '/parent-dashboard',
          'View Dashboard'
        );
      END IF;
      
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
      VALUES (
        NEW.user_id,
        v_family_id,
        'Reward Request Denied',
        'Your request for "' || v_reward_title || '" was not approved. Your ' || v_points || ' points have been returned.',
        'warning',
        '/child-dashboard',
        'View Dashboard'
      );
      
      -- ALSO notify PARENT of rejection
      IF v_parent_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text)
        VALUES (
          v_parent_id,
          v_family_id,
          'Reward Rejected',
          'You rejected "' || v_reward_title || '" for ' || COALESCE(v_child_name, 'child'),
          'info',
          '/parent-dashboard',
          'View Dashboard'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS reward_status_notification ON reward_redemptions;
CREATE TRIGGER reward_status_notification
  AFTER UPDATE ON reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_reward_status_changed();

-- ============================================================================
-- ISSUE 3: ADD 3 DEFAULT FREE REWARDS (NOT PREMIUM-LOCKED)
-- ============================================================================
-- These will be added to every family and won't require premium subscription
-- They demonstrate how the reward system works

-- First, add a column to mark default rewards
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Insert default rewards for ALL existing families
DO $$
DECLARE
  v_family RECORD;
BEGIN
  FOR v_family IN SELECT DISTINCT family_id FROM profiles WHERE family_id IS NOT NULL
  LOOP
    -- Ice cream treat (20 points)
    INSERT INTO rewards (family_id, title, description, points_cost, is_default, is_active, created_by)
    SELECT 
      v_family.family_id,
      '🍦 Ice Cream Treat',
      'Enjoy a delicious ice cream treat!',
      20,
      TRUE,
      TRUE,
      (SELECT id FROM profiles WHERE family_id = v_family.family_id LIMIT 1)
    WHERE NOT EXISTS (
      SELECT 1 FROM rewards 
      WHERE family_id = v_family.family_id 
        AND title = '🍦 Ice Cream Treat'
        AND is_default = TRUE
    );
    
    -- 30 mins screen time (30 points)
    INSERT INTO rewards (family_id, title, description, points_cost, is_default, is_active, created_by)
    SELECT 
      v_family.family_id,
      '📱 30 Mins Screen Time',
      'Extra 30 minutes of screen time for your favorite activity!',
      30,
      TRUE,
      TRUE,
      (SELECT id FROM profiles WHERE family_id = v_family.family_id LIMIT 1)
    WHERE NOT EXISTS (
      SELECT 1 FROM rewards 
      WHERE family_id = v_family.family_id 
        AND title = '📱 30 Mins Screen Time'
        AND is_default = TRUE
    );
    
    -- 1 hour video games (50 points)
    INSERT INTO rewards (family_id, title, description, points_cost, is_default, is_active, created_by)
    SELECT 
      v_family.family_id,
      '🎮 1 Hour Video Games',
      'One full hour to play your favorite video games!',
      50,
      TRUE,
      TRUE,
      (SELECT id FROM profiles WHERE family_id = v_family.family_id LIMIT 1)
    WHERE NOT EXISTS (
      SELECT 1 FROM rewards 
      WHERE family_id = v_family.family_id 
        AND title = '🎮 1 Hour Video Games'
        AND is_default = TRUE
    );
    
  END LOOP;
  
  RAISE NOTICE '✅ Added default rewards to all existing families';
END $$;

-- Create trigger to add default rewards when new family is created
CREATE OR REPLACE FUNCTION add_default_rewards_to_new_family()
RETURNS TRIGGER AS $$
BEGIN
  -- Add 3 default rewards when a new family ID is set
  IF NEW.family_id IS NOT NULL AND (OLD.family_id IS NULL OR OLD.family_id != NEW.family_id) THEN
    
    -- Ice cream treat
    INSERT INTO rewards (family_id, title, description, points_cost, is_default, is_active, created_by)
    SELECT NEW.family_id, '🍦 Ice Cream Treat', 'Enjoy a delicious ice cream treat!', 20, TRUE, TRUE, NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM rewards 
      WHERE family_id = NEW.family_id 
        AND title = '🍦 Ice Cream Treat'
        AND is_default = TRUE
    );
    
    -- 30 mins screen time
    INSERT INTO rewards (family_id, title, description, points_cost, is_default, is_active, created_by)
    SELECT NEW.family_id, '📱 30 Mins Screen Time', 'Extra 30 minutes of screen time for your favorite activity!', 30, TRUE, TRUE, NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM rewards 
      WHERE family_id = NEW.family_id 
        AND title = '📱 30 Mins Screen Time'
        AND is_default = TRUE
    );
    
    -- 1 hour video games
    INSERT INTO rewards (family_id, title, description, points_cost, is_default, is_active, created_by)
    SELECT NEW.family_id, '🎮 1 Hour Video Games', 'One full hour to play your favorite video games!', 50, TRUE, TRUE, NEW.id
    WHERE NOT EXISTS (
      SELECT 1 FROM rewards 
      WHERE family_id = NEW.family_id 
        AND title = '🎮 1 Hour Video Games'
        AND is_default = TRUE
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS add_default_rewards_trigger ON profiles;
CREATE TRIGGER add_default_rewards_trigger
  AFTER INSERT OR UPDATE OF family_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION add_default_rewards_to_new_family();

-- ============================================================================
-- ISSUE 4: FIX ACTIVITY FEED REACTIONS VISIBILITY
-- ============================================================================
-- Update RLS policy to allow viewing ALL reactions from family members
DROP POLICY IF EXISTS "family_view_reactions" ON activity_reactions;

CREATE POLICY "family_view_reactions"
  ON activity_reactions FOR SELECT
  USING (
    activity_id IN (
      SELECT id FROM activity_feed
      WHERE family_id = (
        SELECT family_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Fixed Issues:';
  RAISE NOTICE '  1. ✅ Bulletin messages family_id now TEXT (fixes UUID error)';
  RAISE NOTICE '     + Fixed notify_bulletin_message() trigger to use TEXT';
  RAISE NOTICE '     + Recreated all RLS policies with TEXT column';
  RAISE NOTICE '  2. ✅ Reward notifications now sent to BOTH parent and child';
  RAISE NOTICE '  3. ✅ Added 3 default free rewards to all families:';
  RAISE NOTICE '       - 🍦 Ice Cream Treat (20 points)';
  RAISE NOTICE '       - 📱 30 Mins Screen Time (30 points)';
  RAISE NOTICE '       - 🎮 1 Hour Video Games (50 points)';
  RAISE NOTICE '  4. ✅ Activity feed reactions now visible to all family members';
  RAISE NOTICE '';
  RAISE NOTICE 'Default rewards will auto-generate for new families!';
  RAISE NOTICE '====================================';
END $$;

-- Check results
SELECT 
  family_id,
  COUNT(*) as default_rewards_count
FROM rewards
WHERE is_default = TRUE
GROUP BY family_id
ORDER BY family_id;

SELECT 'Bulletin messages table family_id type:' as check_type, 
       data_type as result
FROM information_schema.columns
WHERE table_name = 'bulletin_messages' 
  AND column_name = 'family_id';
