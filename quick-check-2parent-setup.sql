-- ============================================================================
-- Quick Check: Are Both Parents in Same Family?
-- ============================================================================
-- Simple query to check if 2nd parent setup is correct
-- Replace emails with your actual test accounts
-- ============================================================================

-- Check both parents' profiles
SELECT 
  'Parent Profiles' as check_type,
  au.email,
  p.id as user_id,
  p.full_name,
  p.role,
  p.family_id,
  p.created_at
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email IN (
  'nkanyezi@example.com',  -- Replace with 1st parent email
  'nkazimulu@example.com'   -- Replace with 2nd parent email
)
ORDER BY p.created_at;

-- Check if they have the SAME family_id
SELECT 
  'Family Match Check' as check_type,
  CASE 
    WHEN COUNT(DISTINCT p.family_id) = 1 THEN '✅ Both parents have SAME family_id'
    WHEN COUNT(DISTINCT p.family_id) > 1 THEN '❌ Parents have DIFFERENT family_ids - needs fix!'
    ELSE '⚠️  Problem detected'
  END as status,
  STRING_AGG(DISTINCT p.family_id::text, ', ') as family_ids
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.email IN (
  'nkanyezi@example.com',  -- Replace with 1st parent email
  'nkazimulu@example.com'   -- Replace with 2nd parent email
);

-- Count family members
SELECT 
  'Family Members Count' as check_type,
  p.family_id,
  COUNT(*) FILTER (WHERE p.role = 'parent') as parent_count,
  COUNT(*) FILTER (WHERE p.role = 'child') as child_count,
  COUNT(*) as total_members
FROM public.profiles p
WHERE p.family_id IN (
  SELECT DISTINCT family_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
      'nkanyezi@example.com',  -- Replace
      'nkazimulu@example.com'   -- Replace
    )
  )
)
GROUP BY p.family_id;

-- Show all tasks in the family
SELECT 
  'All Family Tasks' as check_type,
  t.id,
  t.title,
  creator.full_name as created_by_name,
  assignee.full_name as assigned_to_name,
  t.approved,
  t.completed,
  t.created_at
FROM public.tasks t
LEFT JOIN public.profiles creator ON t.created_by = creator.id
LEFT JOIN public.profiles assignee ON t.assigned_to = assignee.id
WHERE t.family_id IN (
  SELECT DISTINCT family_id FROM public.profiles 
  WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN (
      'nkanyezi@example.com',  -- Replace
      'nkazimulu@example.com'   -- Replace
    )
  )
)
ORDER BY t.created_at DESC;

-- ============================================================================
-- INTERPRETATION:
-- ============================================================================
-- 
-- ✅ If "Family Match Check" shows both have SAME family_id:
--    - Registration worked correctly
--    - Problem might be:
--      a) Client-side caching (have 2nd parent log out/in)
--      b) RLS policies blocking visibility
--      c) Browser cache (clear and retry)
--
-- ❌ If "Family Match Check" shows DIFFERENT family_ids:
--    - Run fix-2parent-family-link.sql to correct it
--    - Then have 2nd parent log out and log back in
--
-- ⚠️  If parent_count = 1:
--    - Registration didn't complete properly
--    - 2nd parent might need to re-register
--
-- ============================================================================
