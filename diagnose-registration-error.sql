-- ============================================================================
-- DIAGNOSE REGISTRATION ERROR
-- ============================================================================
-- Check the status of registration trigger and recent failed registrations

-- 1. Check if handle_new_user() trigger exists and is active
SELECT 
  'Trigger Status' as check_name,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  CASE 
    WHEN tgenabled = 'O' THEN '✅ ENABLED'
    WHEN tgenabled = 'D' THEN '❌ DISABLED'
    ELSE 'UNKNOWN: ' || tgenabled::text
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 2. Check if handle_new_user() function exists
SELECT 
  'Function Status' as check_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  '✅ EXISTS' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';

-- 3. Check profiles table structure (ensure family_id column exists)
SELECT 
  'Profiles Table' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('id', 'email', 'role', 'family_id', 'full_name')
ORDER BY ordinal_position;

-- 4. Check families table structure
SELECT 
  'Families Table' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'families'
  AND column_name IN ('id', 'owner_id', 'family_code', 'created_at')
ORDER BY ordinal_position;

-- 5. Check user_profiles table structure
SELECT 
  'User Profiles Table' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name IN ('id', 'role', 'total_points')
ORDER BY ordinal_position;

-- 6. Check RLS policies on profiles table (INSERT must be allowed)
SELECT 
  'Profiles RLS Policies' as check_name,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd IN ('INSERT', 'ALL')
ORDER BY policyname;

-- 7. Check RLS policies on families table (INSERT must be allowed)
SELECT 
  'Families RLS Policies' as check_name,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'families'
  AND cmd IN ('INSERT', 'ALL')
ORDER BY policyname;

-- 8. Check for recent auth.users WITHOUT profiles (registration failures)
SELECT 
  'Recent Registration Failures' as check_name,
  u.id,
  u.email,
  u.created_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE - Trigger Failed'
    WHEN p.family_id IS NULL THEN '⚠️ Profile exists but no family_id'
    WHEN f.id IS NULL THEN '⚠️ Profile has family_id but family missing'
    ELSE '✅ Complete'
  END as status,
  p.role,
  p.family_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN families f ON p.family_id = f.id
WHERE u.created_at > NOW() - INTERVAL '1 hour'
ORDER BY u.created_at DESC
LIMIT 10;

-- 9. Check for auth.users with NO corresponding profiles (trigger failures)
SELECT 
  'Orphaned Auth Users' as check_name,
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'role' as intended_role,
  u.raw_user_meta_data->>'name' as intended_name,
  '❌ TRIGGER FAILED - No profile created' as issue
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC
LIMIT 10;

-- 10. Test if we can manually insert into profiles (permission check)
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Try to insert a test profile
  INSERT INTO profiles (id, email, full_name, role, family_id)
  VALUES (test_id, 'test@test.com', 'Test User', 'child', NULL);
  
  -- If successful, clean up immediately
  DELETE FROM profiles WHERE id = test_id;
  
  RAISE NOTICE '✅ Profiles INSERT permission: OK';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Profiles INSERT permission: FAILED - %', SQLERRM;
END $$;

-- 11. Get the actual trigger function code to see logic
SELECT 
  'Trigger Function Code' as check_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';
