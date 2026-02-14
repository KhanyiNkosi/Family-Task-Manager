-- ============================================================================
-- FIX BOTH ISSUES: Activity Feed & Points Display
-- ============================================================================

-- ============================================================================
-- ISSUE 1: Check if activity feed triggers exist
-- ============================================================================
SELECT 
  'ACTIVITY FEED TRIGGERS' as check_type,
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname LIKE '%activity%'
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- ISSUE 2: Force refresh points calculation
-- ============================================================================
-- This shows the correct calculation that should be displayed
WITH child_points AS (
  SELECT 
    p.id,
    p.full_name,
    COALESCE(SUM(t.points), 0) as earned_points
  FROM profiles p
  LEFT JOIN tasks t ON t.assigned_to = p.id AND t.approved = true
  WHERE p.role = 'child'
  GROUP BY p.id, p.full_name
),
child_spending AS (
  SELECT 
    p.id,
    COALESCE(SUM(rr.points_spent), 0) as spent_points
  FROM profiles p
  LEFT JOIN reward_redemptions rr ON rr.user_id = p.id AND rr.status = 'approved'
  WHERE p.role = 'child'
  GROUP BY p.id
)
SELECT 
  cp.full_name as child_name,
  cp.earned_points,
  COALESCE(cs.spent_points, 0) as spent_points,
  cp.earned_points - COALESCE(cs.spent_points, 0) as current_balance
FROM child_points cp
LEFT JOIN child_spending cs ON cp.id = cs.id
ORDER BY cp.full_name;

-- ============================================================================
-- If triggers don't exist, they need to be created
-- Run create-activity-feed-system-v2.sql if triggers are missing
-- ============================================================================
