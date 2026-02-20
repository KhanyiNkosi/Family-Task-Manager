-- ============================================================================
-- CHECK REGISTRATION LIMIT SETTINGS
-- ============================================================================

-- 1. Check current app_settings for max_users
SELECT 
  'App Settings' as check_name,
  setting_key,
  setting_value,
  setting_value->>'limit' as max_users,
  setting_value->>'enabled' as limit_enabled,
  description
FROM app_settings
WHERE setting_key = 'max_users';

-- 2. Check get_user_stats function exists
SELECT 
  'get_user_stats Function' as check_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  '✅ EXISTS' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_stats';

-- 3. Get the function definition to see what it does
SELECT pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_stats';

-- 4. Count current users in auth.users
SELECT 
  'Current User Count' as check_name,
  COUNT(*) as total_auth_users,
  COUNT(CASE WHEN deleted_at IS NULL THEN 1 END) as active_users,
  COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as deleted_users
FROM auth.users;

-- 5. Count profiles by role
SELECT 
  'Profiles by Role' as check_name,
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY role;

-- 6. Try calling get_user_stats to see what it returns
SELECT * FROM get_user_stats();
