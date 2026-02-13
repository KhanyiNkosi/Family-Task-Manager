-- ============================================================================
-- SAFE ORPHAN LISTING - Part 1: Basic Profile Details
-- ============================================================================
-- Casts both sides to TEXT to avoid type mismatch issues
-- ============================================================================

-- Query 1: Basic orphaned profile details
SELECT 
  p.id::text as profile_id,
  p.email,
  p.full_name,
  p.role,
  p.family_id::text as missing_family_id,
  p.created_at
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f 
    WHERE f.id::text = p.family_id::text
  )
ORDER BY p.created_at DESC;
