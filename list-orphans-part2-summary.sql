-- ============================================================================
-- SAFE ORPHAN LISTING - Part 2: Summary by Role
-- ============================================================================

SELECT 
  p.role,
  COUNT(*) as orphan_count,
  STRING_AGG(p.email, ', ' ORDER BY p.email) as affected_emails
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f 
    WHERE f.id::text = p.family_id::text
  )
GROUP BY p.role
ORDER BY orphan_count DESC;
