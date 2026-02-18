-- ============================================================================
-- FIX: Ensure users can always read their own profile
-- ============================================================================

-- Drop existing profile SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_select_own_profile" ON public.profiles;

-- Create simple, explicit policy for viewing own profile
CREATE POLICY "allow_select_own_profile"
ON public.profiles FOR SELECT TO authenticated
USING ((auth.uid())::uuid = id);

-- Create policy for viewing family member profiles
CREATE POLICY "allow_select_family_profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  family_id IS NOT NULL 
  AND family_id IN (
    SELECT family_id FROM public.profiles 
    WHERE id = (auth.uid())::uuid
    AND family_id IS NOT NULL
  )
);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- Test: Can you see your own profile now?
SELECT 
  id,
  email,
  role,
  family_id,
  'You can see your profile!' as status
FROM public.profiles
WHERE id = auth.uid()
LIMIT 1;
