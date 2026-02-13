-- ============================================================================
-- SCAN: Find all family_id related columns and their types
-- ============================================================================

-- 1. Find all columns with 'family' in the name and their types
SELECT 
  'COLUMNS' as category,
  table_schema,
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name LIKE '%family%' OR column_name = 'id')
  AND table_name IN ('profiles', 'families', 'activity_feed', 'tasks', 'bulletin_messages', 'rewards', 'reward_redemptions')
ORDER BY table_name, column_name;

-- 2. Find all foreign key constraints involving family_id
SELECT 
  'FOREIGN KEYS' as category,
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (kcu.column_name LIKE '%family%' OR ccu.column_name LIKE '%family%')
ORDER BY tc.table_name;

-- 3. Find all functions that reference family_id
SELECT 
  'FUNCTIONS' as category,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) ILIKE '%family_id%'
    OR pg_get_functiondef(p.oid) ILIKE '%family%'
  )
ORDER BY p.proname;

-- 4. Find all policies that reference family_id
SELECT 
  'POLICIES' as category,
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
  AND (
    qual ILIKE '%family_id%'
    OR with_check ILIKE '%family_id%'
    OR qual ILIKE '%family%'
    OR with_check ILIKE '%family%'
  )
ORDER BY tablename, policyname;

-- 5. Summary of UUID vs TEXT columns
SELECT 
  CASE 
    WHEN data_type = 'uuid' THEN '🔴 UUID (needs conversion)'
    WHEN data_type = 'text' THEN '✅ TEXT (already correct)'
    ELSE '⚠️ OTHER: ' || data_type
  END as status,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%family%'
ORDER BY 
  CASE WHEN data_type = 'uuid' THEN 1 ELSE 2 END,
  table_name;
