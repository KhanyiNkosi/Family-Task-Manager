-- ============================================================================
-- DIAGNOSE: What's blocking family_id → UUID conversion?
-- ============================================================================

-- Check for indexes on family_id columns
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexdef LIKE '%family_id%'
  OR (tablename = 'families' AND indexdef LIKE '%id%')
)
ORDER BY tablename, indexname;

-- Check for check constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('families', 'profiles', 'tasks', 'rewards', 'bulletin_messages', 'activity_feed')
ORDER BY tc.table_name, tc.constraint_type;

-- Check for triggers (other than RI_ConstraintTrigger)
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('families', 'profiles', 'tasks', 'rewards', 'bulletin_messages', 'activity_feed')
AND trigger_name NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY event_object_table, trigger_name;

-- Check if PRIMARY KEY still exists on families
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'families'
AND tc.constraint_type = 'PRIMARY KEY';

-- Check if any foreign keys still exist
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
AND (
  kcu.column_name = 'family_id'
  OR (ccu.table_name = 'families' AND ccu.column_name = 'id')
)
ORDER BY tc.table_name;

-- Check if any policies still exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('families', 'profiles', 'tasks', 'rewards', 'bulletin_messages', 'activity_feed')
ORDER BY tablename, policyname;
