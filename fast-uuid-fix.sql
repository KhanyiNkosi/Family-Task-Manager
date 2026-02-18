-- ============================================================================
-- FAST FIX: Convert to UUID + Create Working Policies
-- ============================================================================
-- Simple approach: Drop old policies, convert types, create new policies
-- ============================================================================

\echo '========================================'
\echo 'STEP 1: Drop all family_id policies'
\echo '========================================'

-- Drop all policies on profiles that might reference family_id
DROP POLICY IF EXISTS "allow_select_family_profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can view family profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "allow_select_own_profile" ON public.profiles CASCADE;

-- Drop all policies on families
DROP POLICY IF EXISTS "families_select_owner_or_member" ON public.families CASCADE;
DROP POLICY IF EXISTS "Family members can view family" ON public.families CASCADE;
DROP POLICY IF EXISTS "families_insert_owner" ON public.families CASCADE;
DROP POLICY IF EXISTS "families_update_owner" ON public.families CASCADE;

-- Drop all policies on tasks that reference family_id
DROP POLICY IF EXISTS "tasks_view_family" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_view_assigned" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_view_created" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "Family members can view all family tasks" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_insert_parent" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_update_parent" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_update_assigned" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_update_created" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_delete_parent" ON public.tasks CASCADE;

\echo '✅ Old policies dropped'

\echo ''
\echo '========================================'
\echo 'STEP 2: Convert all columns to UUID'
\echo '========================================'

-- Convert families.id
ALTER TABLE public.families 
ALTER COLUMN id TYPE uuid 
USING id::uuid;

\echo '✅ families.id → uuid'

-- Convert profiles.family_id
ALTER TABLE public.profiles 
ALTER COLUMN family_id TYPE uuid 
USING family_id::uuid;

\echo '✅ profiles.family_id → uuid'

-- Convert tasks.family_id
ALTER TABLE public.tasks 
ALTER COLUMN family_id TYPE uuid 
USING family_id::uuid;

\echo '✅ tasks.family_id → uuid'

-- Convert other tables with family_id
DO $$
DECLARE
  v_table TEXT;
BEGIN
  FOR v_table IN 
    SELECT table_name 
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'family_id'
    AND table_name NOT IN ('profiles', 'tasks', 'families')
    AND data_type IN ('text', 'character varying')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN family_id TYPE uuid USING family_id::uuid', v_table);
    RAISE NOTICE '✅ %.family_id → uuid', v_table;
  END LOOP;
END $$;

\echo ''
\echo '========================================'
\echo 'STEP 3: Create NEW policies for profiles'
\echo '========================================'

-- Users can see their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can see family members (using subquery, not helper function)
CREATE POLICY "Users can view family member profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles self
    WHERE self.id = auth.uid()
    AND self.family_id = profiles.family_id
    AND self.family_id IS NOT NULL
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

\echo '✅ Profiles policies created'

\echo ''
\echo '========================================'
\echo 'STEP 4: Create NEW policies for families'
\echo '========================================'

-- Family members can view their family
CREATE POLICY "Family members can view family"
ON public.families FOR SELECT
TO authenticated
USING (
  id::text IN (
    SELECT family_id::text FROM public.profiles WHERE id = auth.uid()
  )
);

-- Owner can update family
CREATE POLICY "Owner can update family"
ON public.families FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Users can create family
CREATE POLICY "Users can create family"
ON public.families FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

\echo '✅ Families policies created'

\echo ''
\echo '========================================'
\echo 'STEP 5: Create NEW policies for tasks'
\echo '========================================'

-- Family members can view ALL family tasks (this is the key policy!)
CREATE POLICY "Family members can view all family tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (
  family_id IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Parents can create tasks
CREATE POLICY "Parents can create tasks"
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

-- Family members can update family tasks
CREATE POLICY "Family members can update family tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  family_id IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  family_id IN (
    SELECT family_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Task creators can delete their tasks
CREATE POLICY "Task creators can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (created_by = auth.uid());

\echo '✅ Tasks policies created'

\echo ''
\echo '========================================'
\echo 'STEP 6: Verify conversions'
\echo '========================================'

SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'uuid' THEN '✅'
    ELSE '❌'
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
  (column_name = 'family_id')
  OR (table_name = 'families' AND column_name = 'id')
)
ORDER BY table_name, column_name;

\echo ''
\echo '========================================'
\echo 'STEP 7: Verify policies'
\echo '========================================'

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'tasks', 'families')
ORDER BY tablename, policyname;

\echo ''
\echo '========================================'
\echo 'STEP 8: Test RLS (Parent 1)'
\echo '========================================'

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_task_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_parent1_id::text, 'role', 'authenticated')::text, 
    true);
  
  SELECT COUNT(*) INTO v_task_count FROM public.tasks;
  
  RAISE NOTICE 'Parent 1 can see % tasks (expected: 4)', v_task_count;
  
  IF v_task_count = 4 THEN
    RAISE NOTICE '🎉 SUCCESS!';
  ELSE
    RAISE NOTICE '⚠️  Got %, expected 4', v_task_count;
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

\echo ''
\echo '========================================'
\echo 'COMPLETE!'
\echo '========================================'
\echo '✅ All columns converted to UUID'
\echo '✅ New policies created'
\echo '✅ Ready to test'
\echo ''
\echo 'NEXT: Both parents refresh dashboards!'
\echo ''
