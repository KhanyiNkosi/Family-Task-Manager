-- ============================================================================
-- TEST: Can current user read their own profile?
-- ============================================================================

-- Test 1: Check if you can see your own profile
SELECT 
  id,
  email,
  role,
  family_id,
  created_at
FROM public.profiles
WHERE id = auth.uid();

-- Test 2: Check all profile SELECT policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Test 3: Try with explicit casting
SELECT 
  id,
  email,
  role,
  family_id,
  created_at
FROM public.profiles
WHERE id = (auth.uid())::uuid;

-- Test 4: Check if RLS is enabled on profiles
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';
