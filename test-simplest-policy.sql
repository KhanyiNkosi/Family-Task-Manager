-- ============================================================================
-- DIAGNOSTIC: Test with simplest possible policy
-- ============================================================================

-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_family" ON public.profiles;

-- Create the SIMPLEST possible policy - allow ALL authenticated users to see ALL profiles
-- This is just for testing - we'll make it more restrictive once it works
CREATE POLICY "profiles_select_all_authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Verify
SELECT 
  policyname,
  cmd,
  qual,
  '✅ Created' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
AND cmd = 'SELECT';
