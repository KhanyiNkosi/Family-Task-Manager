-- ============================================================================
-- SOLUTION B: Inspect and Fix the Trigger
-- ============================================================================
-- This will show us what trigger is causing the NULL behavior and fix it

-- First, find all triggers related to families deletion
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name,
  CASE t.tgtype::int & 2
    WHEN 2 THEN 'BEFORE'
    ELSE 'AFTER'
  END AS timing,
  CASE t.tgtype::int & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE'
    WHEN 16 THEN 'UPDATE'
    ELSE 'OTHER'
  END AS event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('families', 'rewards')
  AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- Get the full function definition for triggers
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%family%' 
    OR p.proname LIKE '%reward%'
    OR p.proname IN (
      SELECT p2.proname 
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_proc p2 ON t.tgfoid = p2.oid
      WHERE c.relname IN ('families', 'rewards')
    )
  )
ORDER BY p.proname;

-- Once you identify the problematic trigger function, you can:
-- 1. DROP it if it's not needed
-- 2. REPLACE it with corrected logic that deletes rewards instead of NULLing

-- Example: If the trigger is called 'handle_family_delete' and it tries to NULL,
-- you would create a replacement like this:

/*
CREATE OR REPLACE FUNCTION handle_family_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Instead of setting family_id to NULL, just delete the rewards
  DELETE FROM rewards WHERE family_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
*/

-- Note: Run the SELECTs above first to see what actually exists,
-- then decide if you need to modify or drop the trigger
