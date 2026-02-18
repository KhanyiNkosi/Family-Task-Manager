-- ============================================================================
-- DIAGNOSE: Why can't you see your own profile?
-- ============================================================================

-- Test 1: Can you see your profile WITHOUT RLS?
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

SELECT 
  id,
  email,
  role,
  family_id,
  'WITHOUT RLS' as test
FROM public.profiles
WHERE id = (auth.uid())::uuid;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Test 2: Can you see your profile WITH RLS?
SELECT 
  id,
  email,
  role,
  family_id,
  'WITH RLS' as test
FROM public.profiles
WHERE id = (auth.uid())::uuid;

-- Test 3: What is your auth.uid() value?
SELECT 
  auth.uid() as raw_auth_uid,
  (auth.uid())::uuid as casted_auth_uid,
  pg_typeof(auth.uid()) as auth_uid_type;

-- Test 4: What is the id column type?
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'id';

-- Test 5: Try to match directly
SELECT 
  p.id as profile_id,
  auth.uid() as your_auth_uid,
  p.id = auth.uid() as direct_match,
  p.id = (auth.uid())::uuid as casted_match,
  'MATCH TEST' as test
FROM public.profiles p
WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
LIMIT 1;
