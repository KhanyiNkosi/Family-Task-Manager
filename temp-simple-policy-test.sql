-- ============================================================================
-- TEMPORARY FIX: Use super simple policies to test
-- ============================================================================

-- Step 1: Drop restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles;

-- Step 2: Create VERY simple test policy (no subqueries, no casts)
CREATE POLICY "test_view_own_profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Step 3: Test if you can see your profile now
SELECT 
  id,
  email,
  role,
  family_id,
  'Simple policy test' as status
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;

-- Step 4: Check what policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
ORDER BY policyname;
