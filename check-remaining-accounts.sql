-- ============================================================================
-- Check Which Test Accounts Remain
-- ============================================================================

-- Check which emails still exist in auth.users
SELECT 
  email,
  id,
  created_at,
  email_confirmed_at,
  banned_until,
  deleted_at
FROM auth.users
WHERE email IN (
  'nkosik8@gmail.com',
  'kometsilwandle@gmail.com',
  'kometsinkanyezi@gmail.com',
  'nkazimulokometsi@gmail.com'
)
ORDER BY created_at;

-- Check their profiles
SELECT 
  'profiles' as table_name,
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.family_id
FROM public.profiles p
WHERE p.id IN (
  SELECT id FROM auth.users WHERE email IN (
    'nkosik8@gmail.com',
    'kometsilwandle@gmail.com',
    'kometsinkanyezi@gmail.com',
    'nkazimulokometsi@gmail.com'
  )
);

-- Check their user_profiles
SELECT 
  'user_profiles' as table_name,
  up.id,
  up.role,
  up.total_points
FROM public.user_profiles up
WHERE up.id IN (
  SELECT id FROM auth.users WHERE email IN (
    'nkosik8@gmail.com',
    'kometsilwandle@gmail.com',
    'kometsinkanyezi@gmail.com',
    'nkazimulokometsi@gmail.com'
  )
);

-- Check for any tasks
SELECT 
  'tasks' as table_name,
  COUNT(*) as task_count,
  t.created_by
FROM public.tasks t
WHERE t.created_by IN (
  SELECT id FROM auth.users WHERE email IN (
    'nkosik8@gmail.com',
    'kometsilwandle@gmail.com',
    'kometsinkanyezi@gmail.com',
    'nkazimulokometsi@gmail.com'
  )
) OR t.assigned_to IN (
  SELECT id FROM auth.users WHERE email IN (
    'nkosik8@gmail.com',
    'kometsilwandle@gmail.com',
    'kometsinkanyezi@gmail.com',
    'nkazimulokometsi@gmail.com'
  )
)
GROUP BY t.created_by;
