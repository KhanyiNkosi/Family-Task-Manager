-- ============================================================================
-- DIAGNOSE ACTIVITY FEED RLS POLICY ISSUE
-- ============================================================================
-- Error: "new row violates row-level security policy for table 'activity_feed'"
-- This happens when approving tasks - the trigger tries to insert but RLS blocks it

-- 1. Check current RLS policies on activity_feed
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'activity_feed'
ORDER BY cmd, policyname;

-- 2. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'activity_feed';

-- 3. Check activity_feed table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'activity_feed'
ORDER BY ordinal_position;

-- 4. Check if trigger exists for task approval
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%approval%' OR trigger_name LIKE '%activity%'
ORDER BY event_object_table, trigger_name;

-- 5. Check the trigger functions related to activity feed
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (p.proname LIKE '%activity%' OR p.proname LIKE '%approval%')
ORDER BY p.proname;

-- 6. Test query: Can we insert into activity_feed?
-- This will show what the INSERT policy checks
SELECT 
  policyname,
  with_check
FROM pg_policies
WHERE tablename = 'activity_feed' AND cmd = 'INSERT';
