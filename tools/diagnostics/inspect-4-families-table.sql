-- ============================================================================
-- QUERY 4: Check if FAMILIES Table Exists
-- Activity feed needs this table - if missing, we'll need to create it
-- ============================================================================

-- First, check if table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' AND tablename = 'families'
    ) THEN 'TABLE EXISTS ✓'
    ELSE 'TABLE MISSING ✗ - Will need to create it'
  END as families_table_status;

-- If table exists, show its columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'families'
ORDER BY ordinal_position;

-- Expected columns if it exists:
-- ✓ id (UUID)
-- ✓ name (TEXT) - optional
-- ✓ created_at (TIMESTAMPTZ)
