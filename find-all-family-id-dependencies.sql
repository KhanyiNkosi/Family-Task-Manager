-- ============================================================================
-- Find ALL dependencies on family_id columns
-- ============================================================================

-- 1. Find all POLICIES that depend on family_id
SELECT 
  'POLICY' as dependency_type,
  schemaname,
  tablename,
  policyname as object_name,
  'DROP POLICY IF EXISTS "' || policyname || '" ON ' || schemaname || '.' || tablename || ' CASCADE;' as drop_command
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
AND (
  qual LIKE '%family_id%' 
  OR with_check LIKE '%family_id%'
  OR tablename IN (
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'family_id' AND table_schema = 'public'
  )
  OR tablename = 'families'
)
ORDER BY schemaname, tablename, policyname;

-- 2. Find all TRIGGERS that depend on family_id
SELECT 
  'TRIGGER' as dependency_type,
  event_object_schema as schemaname,
  event_object_table as tablename,
  trigger_name as object_name,
  'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON ' || event_object_schema || '.' || event_object_table || ' CASCADE;' as drop_command
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND trigger_name NOT LIKE 'RI_ConstraintTrigger%'
AND (
  event_object_table IN (
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'family_id' AND table_schema = 'public'
  )
  OR event_object_table = 'families'
)
ORDER BY event_object_table, trigger_name;

-- 3. Find all FOREIGN KEYS that depend on family_id or families.id
SELECT 
  'FOREIGN KEY' as dependency_type,
  tc.table_schema as schemaname,
  tc.table_name as tablename,
  tc.constraint_name as object_name,
  'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name || ' DROP CONSTRAINT IF EXISTS ' || tc.constraint_name || ' CASCADE;' as drop_command
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
AND (
  kcu.column_name = 'family_id'
  OR tc.constraint_name LIKE '%family%'
)
ORDER BY tc.table_name;

-- 4. Find all VIEWS that depend on family_id
SELECT 
  'VIEW' as dependency_type,
  table_schema as schemaname,
  table_name as tablename,
  table_name as object_name,
  'DROP VIEW IF EXISTS ' || table_schema || '.' || table_name || ' CASCADE;' as drop_command
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
  SELECT table_name FROM information_schema.columns 
  WHERE column_name = 'family_id' 
  AND table_schema = 'public'
  AND table_name IN (
    SELECT table_name FROM information_schema.views WHERE table_schema = 'public'
  )
)
ORDER BY table_name;

-- 5. Find all INDEXES on family_id
SELECT 
  'INDEX' as dependency_type,
  schemaname,
  tablename,
  indexname as object_name,
  'DROP INDEX IF EXISTS ' || schemaname || '.' || indexname || ' CASCADE;' as drop_command
FROM pg_indexes
WHERE schemaname = 'public'
AND indexdef LIKE '%family_id%'
ORDER BY tablename, indexname;
