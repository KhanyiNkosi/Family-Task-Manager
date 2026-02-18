-- ============================================================================
-- VERIFY: Registration flow components are working
-- ============================================================================

-- 1. Check if profile creation trigger exists and is enabled
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  '✅ Trigger' as type
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if handle_new_user function exists
SELECT 
  routine_name,
  routine_type,
  '✅ Function' as type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- 3. Check if family code generation trigger exists
SELECT 
  trigger_name,
  event_object_table,
  '✅ Trigger' as type
FROM information_schema.triggers
WHERE trigger_name = 'generate_family_code_trigger';

-- 4. Check profiles INSERT policy (must allow new users)
SELECT 
  policyname,
  cmd,
  with_check,
  '✅ Policy' as type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'INSERT';

-- 5. Check families INSERT policy
SELECT 
  policyname,
  cmd,
  with_check,
  '✅ Policy' as type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'families'
  AND cmd = 'INSERT';
