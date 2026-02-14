-- ============================================================================
-- QUERY 2: Inspect PROFILES Table
-- This is critical - we need to verify column names
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected columns we need:
-- ✓ id (UUID)
-- ✓ full_name (TEXT)
-- ✓ role (TEXT) - 'parent' or 'child'
-- ✓ family_id (UUID)
-- ✓ created_at (TIMESTAMPTZ)
