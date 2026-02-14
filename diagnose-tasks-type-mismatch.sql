-- ============================================================================
-- Comprehensive Tasks Table Type Check
-- ============================================================================

-- Check 1: Tasks table column types
SELECT 
  'Tasks Column Types' as check,
  column_name,
  data_type,
  CASE 
    WHEN column_name LIKE '%family%' AND data_type = 'uuid' THEN '❌ Should be TEXT'
    WHEN column_name LIKE '%family%' AND data_type = 'text' THEN '✅ Correct'
    WHEN column_name LIKE '%id%' AND data_type = 'uuid' THEN '⚠️ UUID (check if compared to TEXT)'
    ELSE '✓ ' || data_type
  END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
ORDER BY column_name;

-- Check 2: Find policies that might compare mismatched types
SELECT 
  'Policy Definitions' as check,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
  AND (
    qual LIKE '%family_id%'
    OR qual LIKE '%user_id%'
    OR qual LIKE '%assigned_to%'
    OR qual LIKE '%created_by%'
  )
ORDER BY policyname;

-- Check 3: Show tasks table structure
SELECT 
  'Tasks Table Structure' as check,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Check 4: Find any functions used in tasks policies
SELECT DISTINCT
  'Functions in Policies' as check,
  regexp_matches(qual, '([a-z_]+)\(', 'g') as function_name
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
  AND qual IS NOT NULL;

-- Check 5: Check if auth.uid() returns UUID and we're comparing to TEXT
SELECT 
  'Auth UID Type' as check,
  pg_typeof(auth.uid()) as auth_uid_type;
