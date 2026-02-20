-- Part 4: Initialize Users & Security
-- Run this fourth (final step)

-- Initialize gamification for all existing child users
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id FROM profiles WHERE role = 'child'
  LOOP
    PERFORM ensure_user_gamification_records(v_user.id);
  END LOOP;
END $$;

-- Enable RLS
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS user_levels_select ON user_levels;
CREATE POLICY user_levels_select ON user_levels FOR SELECT USING (true);

DROP POLICY IF EXISTS achievements_select ON achievements;
CREATE POLICY achievements_select ON achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS task_streaks_select ON task_streaks;
CREATE POLICY task_streaks_select ON task_streaks FOR SELECT USING (true);
