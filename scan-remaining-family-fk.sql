-- ============================================================================
-- Scan for tables with family_id that don't have FK constraints yet
-- ============================================================================

-- Find all columns named family_id
SELECT 
  c.table_name,
  c.column_name,
  c.data_type,
  CASE 
    WHEN tc.constraint_name IS NOT NULL THEN '✅ Has FK constraint'
    ELSE '⚠️ Missing FK constraint'
  END as fk_status,
  tc.constraint_name
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
  ON c.table_name = kcu.table_name 
  AND c.column_name = kcu.column_name
  AND c.table_schema = kcu.table_schema
LEFT JOIN information_schema.table_constraints tc
  ON kcu.constraint_name = tc.constraint_name
  AND tc.constraint_type = 'FOREIGN KEY'
WHERE c.table_schema = 'public'
  AND c.column_name = 'family_id'
ORDER BY 
  CASE WHEN tc.constraint_name IS NULL THEN 1 ELSE 2 END,
  c.table_name;

-- Expected: All tables with family_id should show "Has FK constraint"
-- If any show "Missing FK constraint", we should add them
