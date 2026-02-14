-- Check all possible sources of points for the child
-- Run this in Supabase SQL Editor

-- 1. Check tasks (all statuses)
SELECT 
  'TASKS' as source,
  COUNT(*) as count,
  SUM(points) as total_points,
  json_agg(json_build_object(
    'title', title,
    'points', points,
    'completed', completed,
    'approved', approved,
    'created_at', created_at
  ) ORDER BY created_at DESC) as details
FROM tasks
WHERE assigned_to = '17eb2a70-6fef-4f01-8303-03883c92e705'
GROUP BY source;

-- 2. Check reward redemptions (all statuses)
SELECT 
  'REDEMPTIONS' as source,
  status,
  COUNT(*) as count,
  SUM(points_spent) as total_spent
FROM reward_redemptions
WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705'
GROUP BY source, status;

-- 3. Check if there's a points column in profiles
SELECT 
  'PROFILE' as source,
  id,
  full_name,
  role,
  *
FROM profiles
WHERE id = '17eb2a70-6fef-4f01-8303-03883c92e705';

-- 4. Exact calculation the dashboard should use
SELECT 
  'CALCULATION' as source,
  (
    SELECT COALESCE(SUM(points), 0)
    FROM tasks
    WHERE assigned_to = '17eb2a70-6fef-4f01-8303-03883c92e705'
      AND approved = true
  ) as earned_points,
  (
    SELECT COALESCE(SUM(points_spent), 0)
    FROM reward_redemptions
    WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705'
      AND status = 'approved'
  ) as spent_points,
  (
    SELECT COALESCE(SUM(points), 0)
    FROM tasks
    WHERE assigned_to = '17eb2a70-6fef-4f01-8303-03883c92e705'
      AND approved = true
  ) - (
    SELECT COALESCE(SUM(points_spent), 0)
    FROM reward_redemptions
    WHERE user_id = '17eb2a70-6fef-4f01-8303-03883c92e705'
      AND status = 'approved'
  ) as current_balance;
