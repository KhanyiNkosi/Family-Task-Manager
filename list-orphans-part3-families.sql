-- ============================================================================
-- SAFE ORPHAN LISTING - Part 3: Distinct Missing Family IDs
-- ============================================================================

SELECT 
  p.family_id::text as missing_family_id,
  COUNT(DISTINCT p.id) as profile_count,
  COUNT(CASE WHEN p.role = 'parent' THEN 1 END) as parent_count,
  COUNT(CASE WHEN p.role = 'child' THEN 1 END) as child_count,
  STRING_AGG(DISTINCT p.email, ', ' ORDER BY p.email) as members
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f 
    WHERE f.id::text = p.family_id::text
  )
GROUP BY p.family_id::text
ORDER BY profile_count DESC;
