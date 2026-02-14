-- ============================================================================
-- FIX GAMIFICATION RLS - Allow triggers to update gamification tables
-- ============================================================================

-- Gamification tables should allow users to read their own data and 
-- backend functions to write data via triggers

-- 1. User Levels - Allow users to read their own, functions to write
DROP POLICY IF EXISTS "Users can view own level" ON user_levels;
DROP POLICY IF EXISTS "Users can update own level" ON user_levels;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_levels;

CREATE POLICY "Users can read own level"
  ON user_levels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Functions can manage levels"
  ON user_levels FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. User Achievements - Allow users to read their own, functions to write
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_achievements;

CREATE POLICY "Users can read own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Functions can manage achievements"
  ON user_achievements FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. User Streaks - Allow users to read their own, functions to write
DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON user_streaks;

CREATE POLICY "Users can read own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Functions can manage streaks"
  ON user_streaks FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Achievements table - Everyone can read achievement definitions
DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
DROP POLICY IF EXISTS "Enable read access for all users" ON achievements;

CREATE POLICY "Everyone can read achievements"
  ON achievements FOR SELECT
  USING (true);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Gamification RLS policies updated';
  RAISE NOTICE '   - user_levels: users read own, functions manage all';
  RAISE NOTICE '   - user_achievements: users read own, functions manage all';
  RAISE NOTICE '   - user_streaks: users read own, functions manage all';
  RAISE NOTICE '   - achievements: everyone can read';
  RAISE NOTICE '';
  RAISE NOTICE 'Task approval gamification should now work correctly.';
END $$;
