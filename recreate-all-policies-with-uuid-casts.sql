-- ============================================================================
-- RECREATE ALL POLICIES with explicit UUID casts
-- ============================================================================

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "allow_select_family_profiles" ON public.profiles;

DROP POLICY IF EXISTS "Family members can view family" ON public.families;
DROP POLICY IF EXISTS "Owner can update family" ON public.families;
DROP POLICY IF EXISTS "Users can create family" ON public.families;

DROP POLICY IF EXISTS "Family members can view all family tasks" ON public.tasks;
DROP POLICY IF EXISTS "Parents can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Family members can update family tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators can delete tasks" ON public.tasks;

-- ========================================
-- PROFILES (all with ::uuid casts)
-- ========================================

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING ((auth.uid())::uuid = id);

CREATE POLICY "Users can view family member profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles self
    WHERE self.id = (auth.uid())::uuid
    AND self.family_id = profiles.family_id
    AND self.family_id IS NOT NULL
  )
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING ((auth.uid())::uuid = id) 
WITH CHECK ((auth.uid())::uuid = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK ((auth.uid())::uuid = id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE TO authenticated
USING ((auth.uid())::uuid = id);

-- ========================================
-- FAMILIES (all with ::uuid casts)
-- ========================================

CREATE POLICY "Family members can view family"
ON public.families FOR SELECT TO authenticated
USING (
  id IN (
    SELECT family_id FROM public.profiles 
    WHERE id = (auth.uid())::uuid
    AND family_id IS NOT NULL
  )
);

CREATE POLICY "Owner can update family"
ON public.families FOR UPDATE TO authenticated
USING (owner_id = (auth.uid())::uuid) 
WITH CHECK (owner_id = (auth.uid())::uuid);

CREATE POLICY "Users can create family"
ON public.families FOR INSERT TO authenticated
WITH CHECK (owner_id = (auth.uid())::uuid);

-- ========================================
-- TASKS (all with ::uuid casts)
-- ========================================

CREATE POLICY "Family members can view all family tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
  family_id IN (
    SELECT family_id FROM public.profiles 
    WHERE id = (auth.uid())::uuid
    AND family_id IS NOT NULL
  )
);

CREATE POLICY "Parents can create tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  created_by = (auth.uid())::uuid
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (auth.uid())::uuid 
    AND role = 'parent'
    AND family_id = tasks.family_id
  )
);

CREATE POLICY "Family members can update family tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (
  family_id IN (
    SELECT family_id FROM public.profiles 
    WHERE id = (auth.uid())::uuid
    AND family_id IS NOT NULL
  )
)
WITH CHECK (
  family_id IN (
    SELECT family_id FROM public.profiles 
    WHERE id = (auth.uid())::uuid
    AND family_id IS NOT NULL
  )
);

CREATE POLICY "Task creators can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (created_by = (auth.uid())::uuid);

-- ========================================
-- Verify policies
-- ========================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'families', 'tasks')
ORDER BY tablename, cmd, policyname;

-- Test profile access
SELECT 
  id,
  email,
  role,
  family_id,
  '✅ You can see your profile!' as status
FROM public.profiles
WHERE id = (auth.uid())::uuid
LIMIT 1;
