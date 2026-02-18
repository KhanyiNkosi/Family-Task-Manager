-- CHECK PROFILES RLS POLICIES
-- Issue: Parent can't see child profiles even though they're in the same family
-- Console shows: Children loaded: Array(0)

-- Check all RLS policies on profiles table
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
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- Test query as parent user
-- This simulates what the achievements page is doing
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';

SELECT 
  id,
  full_name,
  role,
  family_id
FROM profiles
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'
  AND role = 'child';
