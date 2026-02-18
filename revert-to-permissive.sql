-- ============================================================================
-- REVERT: Back to permissive policy temporarily
-- ============================================================================

-- Drop any existing SELECT policies
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;

DROP POLICY IF EXISTS "families_select" ON public.families;

DROP POLICY IF EXISTS "tasks_select" ON public.tasks;

-- Create permissive policies for testing
CREATE POLICY "profiles_select_all"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "families_select_all"
ON public.families FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "tasks_select_all"
ON public.tasks FOR SELECT
TO authenticated
USING (true);

-- Keep the other policies as they were
-- (update, insert, delete)

SELECT '✅ Reverted to permissive policies - refresh app to test' as status;
