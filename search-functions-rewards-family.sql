-- STEP 1: List all public functions (simpler, safer query)
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE 
        WHEN prosrc LIKE '%family_id%' THEN 'Contains family_id'
        WHEN prosrc LIKE '%rewards%' THEN 'Contains rewards'
        ELSE 'No match'
    END AS match_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- only functions, not aggregates
    AND (prosrc LIKE '%family_id%' OR prosrc LIKE '%rewards%')
ORDER BY p.proname;

-- STEP 2: Get full definition of a specific function (replace FUNCTION_NAME with actual name from step 1)
-- SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'FUNCTION_NAME' AND pronamespace = 'public'::regnamespace;
