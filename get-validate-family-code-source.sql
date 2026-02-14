-- ============================================================================
-- Step 1: Get source of validate_family_code (UUID version)
-- ============================================================================

SELECT pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'validate_family_code'
LIMIT 1;

-- This will show us the implementation so we can recreate it for TEXT version
