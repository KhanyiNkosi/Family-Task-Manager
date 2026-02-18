-- ============================================================================
-- DIAGNOSE: Profile creation issue after UUID migration
-- ============================================================================

-- 1. Check if profiles exist
SELECT 
  id,
  email,
  role,
  family_id,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check if auth users exist but have no profiles
SELECT 
  u.id as auth_user_id,
  u.email,
  u.created_at as auth_created,
  p.id as profile_id,
  p.email as profile_email,
  CASE 
    WHEN p.id IS NULL THEN '❌ MISSING PROFILE'
    ELSE '✅ HAS PROFILE'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 20;

-- 3. Check what triggers exist on profiles
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'profiles'
ORDER BY trigger_name;

-- 4. Check profile INSERT policies
SELECT 
  policyname,
  permissive,
  roles,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
AND cmd = 'INSERT'
ORDER BY policyname;

-- 5. Test if we can manually insert a profile (run this if you need to fix a specific user)
-- Replace 'USER_EMAIL_HERE' with actual email and 'USER_ID_HERE' with auth.uid
/*
INSERT INTO public.profiles (id, email, role, created_at)
VALUES (
  'USER_ID_HERE'::uuid,
  'USER_EMAIL_HERE',
  'parent',
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email;
*/
