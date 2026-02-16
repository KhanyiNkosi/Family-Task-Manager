-- ============================================================================
-- DIAGNOSTIC: Check Family Code Issue
-- ============================================================================
-- Run this to diagnose why new users can't see family codes
-- ============================================================================

-- Check 1: What type is profiles.family_id?
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'family_id';

-- Check 2: What type is families.id?
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'families'
  AND column_name = 'id';

-- Check 3: Recent user profiles - do they have family_id?
SELECT 
  p.id,
  SUBSTRING(p.email, 1, 30) as email,
  p.role,
  p.family_id,
  CASE 
    WHEN p.family_id IS NULL THEN '❌ NULL'
    WHEN LENGTH(p.family_id) > 0 THEN '✅ ' || LENGTH(p.family_id) || ' chars'
    ELSE '⚠️ EMPTY STRING'
  END as family_id_status,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 20;

-- Check 4: Does handle_new_user function exist?
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- Check 5: Does the trigger exist on auth.users?
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check 6: Get the current function definition
SELECT 
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'handle_new_user'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check 7: Count users by family_id status
SELECT 
  CASE 
    WHEN family_id IS NULL THEN 'NULL (broken)'
    WHEN LENGTH(family_id) = 0 THEN 'Empty string (broken)'
    WHEN LENGTH(family_id) = 36 THEN 'UUID format (good)'
    ELSE 'Other (' || LENGTH(family_id) || ' chars)'
  END as family_id_type,
  COUNT(*) as user_count,
  role
FROM profiles
GROUP BY 
  CASE 
    WHEN family_id IS NULL THEN 'NULL (broken)'
    WHEN LENGTH(family_id) = 0 THEN 'Empty string (broken)'
    WHEN LENGTH(family_id) = 36 THEN 'UUID format (good)'
    ELSE 'Other (' || LENGTH(family_id) || ' chars)'
  END,
  role
ORDER BY role, family_id_type;

-- Check 8: Sample families table
SELECT 
  id,
  created_at,
  created_by
FROM families
ORDER BY created_at DESC
LIMIT 10;
