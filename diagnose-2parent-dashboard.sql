-- ============================================================================
-- Diagnose 2-Parent Dashboard Issues
-- ============================================================================
-- This script checks why tasks aren't loading for both parents
-- ============================================================================

-- Check the two parent accounts and their family_ids
SELECT 
  '1. PARENT PROFILES' as check_type,
  p.email,
  p.full_name,
  p.role,
  p.family_id,
  p.created_at
FROM public.profiles p
WHERE p.role = 'parent'
  AND (p.email LIKE '%nkanyezi%' OR p.email LIKE '%nkazimulo%')
ORDER BY p.created_at;

-- Check if both parents have the SAME family_id
SELECT 
  '2. FAMILY_ID CONSISTENCY' as check_type,
  family_id,
  COUNT(*) as parent_count,
  STRING_AGG(email, ', ') as parent_emails
FROM public.profiles
WHERE role = 'parent'
  AND (email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%')
GROUP BY family_id;

-- Check tasks and their family_ids
SELECT 
  '3. TASKS' as check_type,
  t.id,
  t.title,
  t.family_id,
  t.created_by,
  t.assigned_to,
  t.completed,
  t.approved,
  p_creator.email as creator_email,
  p_creator.full_name as creator_name,
  p_assigned.email as assigned_email,
  p_assigned.full_name as assigned_name
FROM public.tasks t
LEFT JOIN public.profiles p_creator ON t.created_by = p_creator.id
LEFT JOIN public.profiles p_assigned ON t.assigned_to = p_assigned.id
WHERE t.family_id IN (
  SELECT family_id FROM public.profiles 
  WHERE role = 'parent' 
  AND (email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%')
)
ORDER BY t.created_at DESC;

-- Check if tasks have NULL family_id (broken tasks)
SELECT 
  '4. BROKEN TASKS (NULL family_id)' as check_type,
  t.id,
  t.title,
  t.created_by,
  p.email as creator_email,
  t.created_at
FROM public.tasks t
LEFT JOIN public.profiles p ON t.created_by = p.id
WHERE t.family_id IS NULL
  AND (t.created_by IN (
    SELECT id FROM public.profiles 
    WHERE email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%'
  ))
ORDER BY t.created_at DESC;

-- Check the families table
SELECT 
  '5. FAMILIES TABLE' as check_type,
  f.id as family_id,
  f.owner_id,
  p.email as owner_email,
  f.created_at
FROM public.families f
LEFT JOIN public.profiles p ON f.owner_id::uuid = p.id
WHERE f.id IN (
  SELECT family_id::text FROM public.profiles 
  WHERE role = 'parent' 
  AND (email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%')
);

-- Check children in this family
SELECT 
  '6. CHILDREN IN FAMILY' as check_type,
  p.email,
  p.full_name,
  p.role,
  p.family_id
FROM public.profiles p
WHERE p.family_id IN (
  SELECT family_id FROM public.profiles 
  WHERE role = 'parent' 
  AND (email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%')
)
AND p.role = 'child';

-- Summary of the issue
SELECT 
  '7. SUMMARY' as check_type,
  (SELECT COUNT(*) FROM public.profiles 
   WHERE role = 'parent' 
   AND (email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%')) as total_parents,
  (SELECT COUNT(DISTINCT family_id) FROM public.profiles 
   WHERE role = 'parent' 
   AND (email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%')) as unique_family_ids,
  (SELECT COUNT(*) FROM public.tasks 
   WHERE family_id IN (
     SELECT family_id FROM public.profiles 
     WHERE role = 'parent' 
     AND (email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%')
   )) as total_family_tasks,
  (SELECT COUNT(*) FROM public.tasks 
   WHERE family_id IS NULL
   AND created_by IN (
     SELECT id FROM public.profiles 
     WHERE email LIKE '%nkanyezi%' OR email LIKE '%nkazimulo%'
   )) as broken_tasks_null_family;
