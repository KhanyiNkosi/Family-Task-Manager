-- ============================================================================
-- CHECK RLS POLICIES: Diagnose Row-Level Security
-- ============================================================================
-- Shows all policies on tasks and profiles tables to identify restrictions
-- ============================================================================

\echo '========================================'
\echo 'RLS POLICIES ON public.tasks'
\echo '========================================'

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'tasks'
ORDER BY policyname;

\echo ''
\echo '========================================'
\echo 'RLS POLICIES ON public.profiles'
\echo '========================================'

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'profiles'
ORDER BY policyname;

\echo ''
\echo '========================================'
\echo 'RLS STATUS (is RLS enabled?)'
\echo '========================================'

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'profiles')
ORDER BY tablename;

\echo ''
\echo '========================================'
\echo 'ANALYSIS'
\echo '========================================'
\echo 'Look for policies with USING clauses like:'
\echo '  - auth.uid() = created_by  (ownership-only, BAD for family)'
\echo '  - auth.uid() = assigned_to (assignment-only, BAD for family)'
\echo ''
\echo 'We need policies that allow family-wide access:'
\echo '  - family_id IN (SELECT family_id FROM profiles WHERE id = auth.uid())'
\echo ''
