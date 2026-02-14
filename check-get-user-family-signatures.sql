-- ============================================================================
-- Check all signatures of get_user_family function
-- ============================================================================

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_family'
ORDER BY pg_get_function_identity_arguments(p.oid);

-- This will show us exactly what signatures exist so we can drop the right one
