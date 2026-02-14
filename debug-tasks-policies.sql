-- ============================================================================
-- Find Type Mismatch in Tasks RLS Policies
-- ============================================================================
-- Search for policies that might have UUID comparisons
-- ============================================================================

-- Show all policies on tasks table
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tasks'
ORDER BY policyname;

-- This will show us the exact policy definitions to find the UUID comparison
