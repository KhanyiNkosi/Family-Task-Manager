-- ============================================================================
-- QUERY 3: Inspect TASKS Table
-- Critical for activity feed and gamification integration
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Expected columns we need:
-- ✓ id (UUID)
-- ✓ title (TEXT)
-- ✓ points (INTEGER)
-- ✓ assigned_to (UUID) - or could be 'assignee_id'
-- ✓ created_by (UUID)
-- ✓ completed (BOOLEAN)
-- ✓ approved (BOOLEAN)
-- ✓ completed_at (TIMESTAMPTZ)
-- ✓ family_id (UUID)
