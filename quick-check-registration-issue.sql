-- ============================================================================
-- QUICK CHECK - Registration Issue
-- ============================================================================

-- 1. Is trigger active?
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as on_table,
  CASE tgenabled::text
    WHEN 'O' THEN '✅ ENABLED'
    WHEN 'D' THEN '❌ DISABLED'
    ELSE '⚠️ UNKNOWN'
  END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 2. Recent failed registrations (auth users without profiles)
SELECT 
  'Recent Failed Registrations' as type,
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'role' as intended_role,
  u.raw_user_meta_data->>'name' as intended_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.created_at > NOW() - INTERVAL '1 day'
ORDER BY u.created_at DESC
LIMIT 5;

-- 3. Check if profiles table exists and has correct columns
SELECT 
  'Profiles Table Columns' as type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check if families table exists
SELECT 
  'Families Table Columns' as type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'families'
ORDER BY ordinal_position;

-- 5. Get handle_new_user function to see what it's doing
SELECT pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';
