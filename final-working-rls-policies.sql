-- ============================================================================
-- FIX: Create working RLS policies for UUID columns
-- ============================================================================

-- Step 1: Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "test_view_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Family members can view family" ON public.families;
DROP POLICY IF EXISTS "Owner can update family" ON public.families;
DROP POLICY IF EXISTS "Users can create family" ON public.families;

DROP POLICY IF EXISTS "Family members can view all family tasks" ON public.tasks;
DROP POLICY IF EXISTS "Parents can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Family members can update family tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators can delete tasks" ON public.tasks;

-- Step 3: Create bulletproof policies using auth.uid() directly
-- (No casts needed when both sides are UUID)

-- PROFILES policies
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_select_family"
ON public.profiles FOR SELECT
TO authenticated
USING (
  family_id IS NOT NULL 
  AND family_id = (
    SELECT family_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete_own"
ON public.profiles FOR DELETE
TO authenticated
USING (id = auth.uid());

-- FAMILIES policies  
CREATE POLICY "families_select_members"
ON public.families FOR SELECT
TO authenticated
USING (
  id = (SELECT family_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "families_update_owner"
ON public.families FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "families_insert"
ON public.families FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- TASKS policies
CREATE POLICY "tasks_select_family"
ON public.tasks FOR SELECT
TO authenticated
USING (
  family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "tasks_insert_parent"
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

CREATE POLICY "tasks_update_family"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "tasks_delete_creator"
ON public.tasks FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- Step 4: Verify policies were created
SELECT 
  tablename,
  policyname,
  cmd,
  '✅ Created' as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'families', 'tasks')
ORDER BY tablename, cmd, policyname;
