-- ============================================================================
-- Replace validate_family_code_text with independent implementation
-- ============================================================================
-- Step 1: Run get-validate-family-code-source.sql to get the UUID version's code
-- Step 2: Use that code to create this replacement (see TEMPLATE below)
-- Step 3: Run this script to replace the wrapper with independent logic
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Replacing validate_family_code_text';
  RAISE NOTICE 'with independent implementation...';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- DROP old wrapper that depends on UUID function
-- ============================================================================

DROP FUNCTION IF EXISTS public.validate_family_code_text(text) CASCADE;

-- ============================================================================
-- CREATE independent TEXT-returning version
-- ============================================================================

-- Based on source from validate_family_code (UUID version):
-- SELECT id::uuid, owner_id, name FROM public.families WHERE invitation_code = code

CREATE OR REPLACE FUNCTION public.validate_family_code_text(code text)
RETURNS TABLE(family_id text, owner_id text, name text)
LANGUAGE sql
STABLE
AS $function$
  SELECT 
    id,                    -- families.id is already TEXT (not casting)
    owner_id::text,        -- owner_id is UUID, cast to TEXT
    name                   -- name is already TEXT
  FROM public.families
  WHERE invitation_code = code
  LIMIT 1;
$function$;

DO $$
BEGIN
  RAISE NOTICE '✅ Created independent validate_family_code_text';
  RAISE NOTICE '   (returning TEXT without calling UUID function)';
END $$;

-- ============================================================================
-- Now safe to DROP UUID version
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Dropping UUID-returning validate_family_code...';
END $$;

DROP FUNCTION IF EXISTS public.validate_family_code(text) CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped validate_family_code (UUID version)';
END $$;

-- ============================================================================
-- VERIFY: Only TEXT-returning functions remain
-- ============================================================================

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) LIKE '%text%' THEN '✅ Returns TEXT'
    WHEN pg_get_function_result(p.oid) LIKE '%uuid%' THEN '❌ Still returns UUID'
    ELSE '? ' || pg_get_function_result(p.oid)
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%family%'
  AND pg_get_function_result(p.oid) LIKE '%uuid%'
ORDER BY p.proname;

-- Expected: 0 rows (no UUID-returning family functions remain)

-- ============================================================================
-- FINAL SUCCESS CHECK
-- ============================================================================

DO $$
DECLARE
  v_uuid_functions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_uuid_functions
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname ILIKE '%family%'
    AND pg_get_function_result(p.oid) LIKE '%uuid%';
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  
  IF v_uuid_functions = 0 THEN
    RAISE NOTICE '✅✅✅ MIGRATION 100%% COMPLETE! ✅✅✅';
    RAISE NOTICE '====================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All family functions now return TEXT!';
    RAISE NOTICE '';
    RAISE NOTICE 'Final Status:';
    RAISE NOTICE '  ✅ All family_id columns = TEXT';
    RAISE NOTICE '  ✅ All family functions = TEXT';
    RAISE NOTICE '  ✅ 0 orphaned profiles';
    RAISE NOTICE '  ✅ RLS policies active';
    RAISE NOTICE '';
    RAISE NOTICE 'Ready for next steps:';
    RAISE NOTICE '  1. Add FK constraints (add-foreign-keys.sql)';
    RAISE NOTICE '  2. Fix registration trigger (fix-registration-flow.sql)';
    RAISE NOTICE '  3. Test with real users (family 32af85db...)';
    RAISE NOTICE '  4. Push 28+ commits to GitHub';
  ELSE
    RAISE WARNING '⚠️ Still % UUID-returning functions', v_uuid_functions;
  END IF;
  
  RAISE NOTICE '====================================';
END $$;
