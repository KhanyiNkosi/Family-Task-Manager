-- ============================================================================
-- FIX TASK RLS POLICIES: Enable Family-Wide Task Access
-- ============================================================================
-- Updates Row-Level Security policies to allow all family members
-- to see all tasks in their family (not just tasks they created/assigned)
-- ============================================================================

-- IMPORTANT: Run check-rls-policies.sql first to see existing policies!
-- This script will DROP old restrictive policies and create new family-aware ones.

\echo '========================================'
\echo 'BACKUP: Current Task Policies'
\echo '========================================'

-- Show what we're about to change
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'tasks';

\echo ''
\echo '========================================'
\echo 'UPDATING RLS POLICIES ON public.tasks'
\echo '========================================'

-- Drop old restrictive policies (adjust names based on check-rls-policies.sql output)
-- Common policy names to check for:
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Parents can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON public.tasks;
DROP POLICY IF EXISTS "Users can view their tasks" ON public.tasks;
DROP POLICY IF EXISTS "Family members can view tasks" ON public.tasks;

\echo 'Dropped old policies (if they existed)'
\echo ''

-- Create new family-wide SELECT policy
CREATE POLICY "Family members can view all family tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  family_id IN (
    SELECT family_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

\echo '✅ Created: Family members can view all family tasks'

-- Allow task creation by family members
DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Parents can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Family members can create tasks" ON public.tasks;

CREATE POLICY "Family members can create tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND family_id IN (
    SELECT family_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

\echo '✅ Created: Family members can create tasks'

-- Allow task updates by family members (for approval, completion, etc.)
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Parents can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Children can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Family members can update tasks" ON public.tasks;

CREATE POLICY "Family members can update family tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
  family_id IN (
    SELECT family_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  family_id IN (
    SELECT family_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

\echo '✅ Created: Family members can update family tasks'

-- Allow task deletion by creators only (for safety)
DROP POLICY IF EXISTS "Users can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Parents can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task creators can delete tasks" ON public.tasks;

CREATE POLICY "Task creators can delete their tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
  AND family_id IN (
    SELECT family_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

\echo '✅ Created: Task creators can delete their tasks'

\echo ''
\echo '========================================'
\echo 'VERIFICATION'
\echo '========================================'

-- Show new policies
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN qual LIKE '%family_id IN%' THEN '✅ Family-aware'
    WHEN qual LIKE '%auth.uid() = created_by%' THEN '⚠️  Ownership-only'
    ELSE '❓ Check manually'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'tasks'
ORDER BY cmd, policyname;

\echo ''
\echo '========================================'
\echo 'NEXT STEPS'
\echo '========================================'
\echo '1. Run test-parent-access.sql to verify both parents can see tasks'
\echo '2. Have both parents refresh their dashboards (logout/login if needed)'
\echo '3. Verify tasks load correctly for both parents'
\echo ''
