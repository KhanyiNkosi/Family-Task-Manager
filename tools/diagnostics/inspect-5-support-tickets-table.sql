-- ============================================================================
-- QUERY 5: Inspect SUPPORT_TICKETS Table
-- Verify the exact column names to avoid errors
-- ============================================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'support_tickets'
ORDER BY ordinal_position;

-- We need to confirm these column names exist:
-- ✓ name
-- ✓ email
-- ✓ category
-- ✓ message
-- ✓ status
-- ✓ priority
-- ✓ assignee_id (or assigned_to?)
-- ✓ user_id
-- ✓ created_at
-- ✓ updated_at
-- ✓ resolved_at
