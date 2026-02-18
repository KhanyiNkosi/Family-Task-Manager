-- ============================================================================
-- TEMPORARY: Disable RLS to test if app works without it
-- ============================================================================

-- Disable RLS on profiles temporarily
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- Now try logging into the app - it should work
-- If it does, the problem is with the RLS policies
-- If it doesn't, the problem is elsewhere

-- After testing, RE-ENABLE RLS with this command:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
