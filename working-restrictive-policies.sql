-- ============================================================================
-- Create proper restrictive RLS policies (now that we know USING (true) works)
-- ============================================================================

-- Drop the test policy
DROP POLICY IF EXISTS "profiles_select_all_authenticated" ON public.profiles;

-- PROFILES: Combine own + family viewing into ONE policy
-- Users can see their own profile OR profiles in their family
CREATE POLICY "profiles_select"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR (
    family_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles self
      WHERE self.id = auth.uid()
      AND self.family_id = profiles.family_id
    )
  )
);

CREATE POLICY "profiles_update"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete"
ON public.profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- FAMILIES: Users can see/update families they belong to
DROP POLICY IF EXISTS "families_select_members" ON public.families;
DROP POLICY IF EXISTS "families_update_owner" ON public.families;
DROP POLICY IF EXISTS "families_insert" ON public.families;

CREATE POLICY "families_select"
ON public.families FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND family_id = families.id
  )
);

CREATE POLICY "families_update"
ON public.families FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "families_insert"
ON public.families FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- TASKS: Family members can view/manage family tasks
DROP POLICY IF EXISTS "tasks_select_family" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_parent" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_family" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete_creator" ON public.tasks;

CREATE POLICY "tasks_select"
ON public.tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND family_id = tasks.family_id
  )
);

CREATE POLICY "tasks_insert"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'parent'
    AND family_id = tasks.family_id
  )
);

CREATE POLICY "tasks_update"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND family_id = tasks.family_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND family_id = tasks.family_id
  )
);

CREATE POLICY "tasks_delete"
ON public.tasks FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Verify all policies
SELECT 
  tablename,
  policyname,
  cmd,
  '✅ Created' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'families', 'tasks')
ORDER BY tablename, policyname;
