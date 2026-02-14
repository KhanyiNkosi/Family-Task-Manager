-- ============================================================================
-- EXPORT ALL POLICY DEFINITIONS (For Documentation/Backup)
-- ============================================================================
-- This exports all current policies with TEXT-compatible comparisons
-- Save this output for future reference
-- ============================================================================

SELECT 
  '-- ============================================================' as line
UNION ALL
SELECT '-- TABLE: ' || schemaname || '.' || tablename
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename
LIMIT 1;

-- ============================================================================
-- EXPORT FORMAT: Ready to execute policy creation statements
-- ============================================================================

WITH policy_definitions AS (
  SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
      WHEN cmd = 'SELECT' THEN 'FOR SELECT'
      WHEN cmd = 'INSERT' THEN 'FOR INSERT'
      WHEN cmd = 'UPDATE' THEN 'FOR UPDATE'
      WHEN cmd = 'DELETE' THEN 'FOR DELETE'
      ELSE 'FOR ALL'
    END as for_clause,
    array_to_string(roles, ', ') as roles_str,
    qual,
    with_check,
    permissive
  FROM pg_policies
  WHERE schemaname IN ('public', 'storage')
    AND tablename IN (
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND (column_name LIKE '%family%' OR table_name = 'families')
      UNION
      SELECT 'objects' -- storage.objects policies
    )
)
SELECT 
  format(
    E'-- %s.%s.%s\nCREATE POLICY %I ON %s.%s\n  %s\n  TO %s\n  %sUSING (%s)%s;\n',
    schemaname,
    tablename,
    policyname,
    policyname,
    schemaname,
    tablename,
    for_clause,
    roles_str,
    CASE WHEN permissive = 'PERMISSIVE' THEN '' ELSE 'AS RESTRICTIVE\n  ' END,
    COALESCE(qual, 'true'),
    CASE 
      WHEN with_check IS NOT NULL THEN E'\n  WITH CHECK (' || with_check || ')'
      ELSE ''
    END
  ) as policy_creation_statement
FROM policy_definitions
ORDER BY schemaname, tablename, policyname;

-- ============================================================================
-- POLICIES WITH TEXT CASTS (Key to Migration Success)
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  '✅ Has ::text cast' as cast_status,
  qual as using_clause
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND (qual LIKE '%::text%' OR with_check LIKE '%::text%')
ORDER BY schemaname, tablename, policyname;

-- Note: Policies with ::text casts are crucial for UUID function compatibility

-- ============================================================================
-- FUNCTION COMPATIBILITY NOTES
-- ============================================================================

SELECT 
  'IMPORTANT: Functions returning UUID must be cast to TEXT in policies' as note,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  'Use: ' || p.proname || '()::text in policy expressions' as usage_example
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_function_result(p.oid) LIKE '%uuid%'
  AND (
    p.proname ILIKE '%family%'
    OR pg_get_functiondef(p.oid) ILIKE '%family%'
  )
ORDER BY p.proname;

-- ============================================================================
-- COMPLETE POLICY BACKUP (Machine-readable format)
-- ============================================================================

SELECT 
  jsonb_build_object(
    'schema', schemaname,
    'table', tablename,
    'policy', policyname,
    'command', cmd,
    'roles', roles,
    'permissive', permissive,
    'using', qual,
    'with_check', with_check,
    'created_at', CURRENT_TIMESTAMP,
    'migration_note', 'Post UUID→TEXT migration - all family_id columns are TEXT'
  ) as policy_json
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND tablename IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (column_name LIKE '%family%' OR table_name = 'families')
    UNION
    SELECT 'objects'
  )
ORDER BY schemaname, tablename, policyname;

-- Save this JSON output for machine-readable backup
