-- COMPREHENSIVE FAMILY DIAGNOSTICS
-- Run this to find the exact issue with family members not showing

-- 1. CHECK FOR PROFILES WITH NULL FAMILY_ID (MOST LIKELY ISSUE)
SELECT 
  id,
  full_name,
  role,
  family_id,
  created_at,
  CASE 
    WHEN family_id IS NULL THEN '❌ MISSING FAMILY_ID - THIS IS THE PROBLEM!'
    ELSE '✅ Has family_id'
  END as status
FROM profiles
ORDER BY family_id NULLS FIRST, role, created_at;

-- 2. SHOW FAMILY STRUCTURE (who belongs to which family)
SELECT 
  family_id,
  COUNT(*) as member_count,
  STRING_AGG(full_name || ' (' || role || ')', ', ' ORDER BY role DESC, full_name) as members
FROM profiles
WHERE family_id IS NOT NULL
GROUP BY family_id
ORDER BY member_count DESC;

-- 3. CALCULATE REAL POINTS PER USER FROM TASKS
SELECT 
  p.id as user_id,
  p.full_name,
  p.role,
  p.family_id,
  COUNT(t.id) FILTER (WHERE t.completed = true) as completed_tasks,
  COUNT(t.id) FILTER (WHERE t.approved = true) as approved_tasks,
  COALESCE(SUM(t.points) FILTER (WHERE t.completed = true), 0) as completed_points,
  COALESCE(SUM(t.points) FILTER (WHERE t.approved = true), 0) as approved_points,
  COALESCE(SUM(t.points) FILTER (WHERE t.completed = true OR t.approved = true), 0) as total_points
FROM profiles p
LEFT JOIN tasks t ON t.assigned_to = p.id
GROUP BY p.id, p.full_name, p.role, p.family_id
ORDER BY total_points DESC;

-- 4. CHECK FOR ORPHANED TASKS (tasks not linked to any profile)
SELECT 
  COUNT(*) as orphaned_tasks,
  'Tasks with assigned_to not matching any profile' as issue
FROM tasks t
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = t.assigned_to
);

-- 5. FIND FAMILY_ID MISMATCHES (tasks assigned to users from different families)
SELECT 
  t.id as task_id,
  t.title,
  t.family_id as task_family_id,
  p.family_id as user_family_id,
  p.full_name,
  'MISMATCH!' as issue
FROM tasks t
JOIN profiles p ON t.assigned_to = p.id
WHERE t.family_id IS DISTINCT FROM p.family_id
LIMIT 20;
