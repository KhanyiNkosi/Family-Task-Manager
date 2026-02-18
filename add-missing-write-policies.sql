-- ============================================================================
-- Ensure all policies needed for registration flow exist
-- ============================================================================

-- PROFILES: Critical for registration
-- INSERT: Trigger creates profile (runs as SECURITY DEFINER, bypasses RLS)
-- But good to have policy for manual inserts
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE: Users need to update their own profile (join family, change settings)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- DELETE: Allow users to delete their own profile
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

CREATE POLICY "profiles_delete_own"
ON public.profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- FAMILIES: Parents create families during registration
DROP POLICY IF EXISTS "families_insert" ON public.families;

CREATE POLICY "families_insert"
ON public.families FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- UPDATE: Owners can update family settings
DROP POLICY IF EXISTS "families_update_owner" ON public.families;
DROP POLICY IF EXISTS "families_update" ON public.families;

CREATE POLICY "families_update_owner"
ON public.families FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- TASKS: Parents can create tasks
DROP POLICY IF EXISTS "tasks_insert_parent" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;

CREATE POLICY "tasks_insert_family"
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

-- UPDATE: Family members can update tasks
DROP POLICY IF EXISTS "tasks_update_family" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;

CREATE POLICY "tasks_update_family"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND family_id = tasks.family_id
  )
);

-- DELETE: Task creators can delete
DROP POLICY IF EXISTS "tasks_delete_creator" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

CREATE POLICY "tasks_delete_creator"
ON public.tasks FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- REWARDS: Parents can create rewards
DROP POLICY IF EXISTS "rewards_insert" ON public.rewards;

CREATE POLICY "rewards_insert_family"
ON public.rewards FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'parent'
    AND family_id = rewards.family_id
  )
);

-- UPDATE: Creators can update
DROP POLICY IF EXISTS "rewards_update" ON public.rewards;

CREATE POLICY "rewards_update_creator"
ON public.rewards FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- DELETE: Creators can delete
DROP POLICY IF EXISTS "rewards_delete" ON public.rewards;

CREATE POLICY "rewards_delete_creator"
ON public.rewards FOR DELETE
TO authenticated
USING (created_by = auth.uid());

SELECT '✅ All INSERT/UPDATE/DELETE policies for registration added!' as status;
