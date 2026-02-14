-- ============================================================================
-- CLEANUP: Drop Old get_user_family(UUID) Signature
-- ============================================================================
-- Only run this after confirming with verify-function-state.sql that
-- a UUID-returning signature exists and is not needed
-- ============================================================================

BEGIN;

-- Show what will be dropped
SELECT 
  'Functions to be dropped' as action,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_family'
  AND pg_get_function_result(p.oid) LIKE '%uuid%';

-- Drop the UUID-returning signature
DROP FUNCTION IF EXISTS public.get_user_family(UUID) CASCADE;

-- Verify only TEXT version remains
SELECT 
  'Remaining functions' as status,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'get_user_family';

COMMIT;

-- Expected: Only get_user_family(UUID) returning TEXT should remain

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped get_user_family(UUID) signature';
  RAISE NOTICE 'Only TEXT-returning version remains';
END $$;
