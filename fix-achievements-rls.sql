-- FIX ACHIEVEMENTS TABLE RLS POLICIES
-- Issue: Parent users can't read achievements (returns 0 rows)
-- The achievements table should be readable by all authenticated users

-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'achievements';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'achievements';

-- Drop any restrictive policies
DROP POLICY IF EXISTS "Users can view achievements" ON achievements;
DROP POLICY IF EXISTS "Authenticated users can view achievements" ON achievements;
DROP POLICY IF EXISTS "Enable read access for all users" ON achievements;
DROP POLICY IF EXISTS "Public achievements read" ON achievements;

-- Enable RLS (if not already enabled)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Create permissive policy: ALL authenticated users can read achievements
CREATE POLICY "Anyone can view achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify the policy was created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'achievements';

-- Test: Try to read achievements as the parent user
-- This simulates what the app is doing
SELECT COUNT(*) as total_achievements FROM achievements;
