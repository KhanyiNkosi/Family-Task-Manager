-- List all triggers on the families table
SELECT 
    tgname AS trigger_name,
    tgtype,
    tgenabled,
    proname AS function_name,
    pg_get_triggerdef(pg_trigger.oid) AS trigger_definition
FROM pg_trigger
JOIN pg_class ON pg_trigger.tgrelid = pg_class.oid
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
LEFT JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE pg_namespace.nspname = 'public'
    AND pg_class.relname = 'families'
    AND NOT tgisinternal
ORDER BY tgname;
