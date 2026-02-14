-- Diagnostic script to verify reward_redemptions table setup
-- Run this in Supabase SQL Editor to check what's wrong

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'reward_redemptions'
) as table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reward_redemptions'
ORDER BY ordinal_position;

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reward_redemptions';

-- 4. List all policies on the table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'reward_redemptions';

-- 5. Check if table is exposed via PostgREST API
SELECT * FROM pg_catalog.pg_class 
WHERE relname = 'reward_redemptions';

-- 6. Test if current user can insert (run this logged in as a child user)
-- This will fail but show you the error message
-- INSERT INTO reward_redemptions (user_id, reward_id, points_spent, status) 
-- VALUES (auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid, 100, 'pending');
