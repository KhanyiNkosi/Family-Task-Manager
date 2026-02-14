-- Debug script to check family members and family code issue
-- Run this in Supabase SQL Editor to diagnose the problem

-- 1. Check profiles table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if there are any profiles at all
SELECT COUNT(*) as total_profiles FROM profiles;

-- 3. Show all profiles with their family_id
SELECT 
  id,
  full_name,
  role,
  family_id,
  created_at
FROM profiles
ORDER BY family_id, role, created_at;

-- 4. Group by family_id to see family structure
SELECT 
  family_id,
  COUNT(*) as member_count,
  STRING_AGG(full_name || ' (' || role || ')', ', ') as members
FROM profiles
WHERE family_id IS NOT NULL
GROUP BY family_id;

-- 5. Check if any profiles have NULL family_id
SELECT 
  id,
  full_name,
  role,
  'NULL family_id - THIS IS A PROBLEM!' as issue
FROM profiles
WHERE family_id IS NULL;

-- 6. Check if tasks table exists and show its structure
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Sample tasks data (if table exists) - adjust query based on actual columns above
-- Uncomment and adjust after seeing column names:
/*
SELECT 
  id,
  assigned_to,
  points,
  completed,
  -- status, (if this column exists)
  created_at
FROM tasks
LIMIT 10;
*/
