-- Diagnostic query to check child's task points
-- Run this in Supabase SQL Editor to see all point-earning tasks

-- Replace 'CHILD_USER_ID' with actual child's user ID from profiles table

-- 1. Show all tasks for the child with their status
SELECT 
  id,
  title,
  points,
  completed,
  approved,
  completed_at,
  created_at,
  CASE 
    WHEN completed = true AND approved = true THEN '✓ COUNTED (both flags)'
    WHEN completed = true AND (approved = false OR approved IS NULL) THEN '⚠ COMPLETED but NOT APPROVED'
    WHEN approved = true AND (completed = false OR completed IS NULL) THEN '⚠ APPROVED but NOT COMPLETED'
    ELSE '✗ NOT COUNTED'
  END as status,
  points as points_value
FROM tasks
WHERE assigned_to = 'CHILD_USER_ID'
ORDER BY created_at DESC;

-- 2. Points breakdown by status
SELECT 
  COUNT(*) as task_count,
  SUM(points) as total_points,
  CASE 
    WHEN completed = true AND approved = true THEN 'Both completed AND approved'
    WHEN completed = true AND (approved = false OR approved IS NULL) THEN 'Completed but NOT approved'
    WHEN approved = true AND (completed = false OR completed IS NULL) THEN 'Approved but NOT completed'
    ELSE 'Neither completed nor approved'
  END as task_status
FROM tasks
WHERE assigned_to = 'CHILD_USER_ID'
GROUP BY 
  CASE 
    WHEN completed = true AND approved = true THEN 'Both completed AND approved'
    WHEN completed = true AND (approved = false OR approved IS NULL) THEN 'Completed but NOT approved'
    WHEN approved = true AND (completed = false OR completed IS NULL) THEN 'Approved but NOT completed'
    ELSE 'Neither completed nor approved'
  END;

-- 3. Check reward redemptions
SELECT 
  COUNT(*) as redemption_count,
  SUM(points_spent) as total_spent
FROM reward_redemptions
WHERE user_id = 'CHILD_USER_ID';

-- 4. Expected vs Current Points
SELECT 
  (SELECT COALESCE(SUM(points), 0) 
   FROM tasks 
   WHERE assigned_to = 'CHILD_USER_ID' 
   AND completed = true AND approved = true) as earned_points_current_logic,
  
  (SELECT COALESCE(SUM(points), 0) 
   FROM tasks 
   WHERE assigned_to = 'CHILD_USER_ID' 
   AND approved = true) as earned_points_approved_only,
  
  (SELECT COALESCE(SUM(points_spent), 0) 
   FROM reward_redemptions 
   WHERE user_id = 'CHILD_USER_ID') as spent_points,
  
  (SELECT COALESCE(SUM(points), 0) 
   FROM tasks 
   WHERE assigned_to = 'CHILD_USER_ID' 
   AND completed = true AND approved = true) - 
  (SELECT COALESCE(SUM(points_spent), 0) 
   FROM reward_redemptions 
   WHERE user_id = 'CHILD_USER_ID') as current_balance_strict,
   
  (SELECT COALESCE(SUM(points), 0) 
   FROM tasks 
   WHERE assigned_to = 'CHILD_USER_ID' 
   AND approved = true) - 
  (SELECT COALESCE(SUM(points_spent), 0) 
   FROM reward_redemptions 
   WHERE user_id = 'CHILD_USER_ID') as current_balance_approved_only;
