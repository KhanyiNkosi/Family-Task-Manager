-- ============================================================================
-- LIST ORPHANED PROFILES - See which profiles need fixing
-- ============================================================================
-- Safe query: No joins, just shows profiles that have family_ids not in families
-- ============================================================================

-- Show the 4 orphaned profiles with full details
SELECT 
  'Orphaned Profile Details' as check_name,
  p.id as profile_id,
  p.email,
  p.full_name,
  p.role,
  p.family_id as missing_family_id,
  p.created_at as profile_created,
  p.updated_at as profile_updated
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f WHERE f.id = p.family_id
  )
ORDER BY p.created_at;

-- Summary by role
SELECT 
  'Orphans by Role' as check_name,
  p.role,
  COUNT(*) as orphan_count,
  STRING_AGG(p.email, ', ') as emails
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f WHERE f.id = p.family_id
  )
GROUP BY p.role;

-- Show distinct missing family_ids
SELECT 
  'Missing Family IDs' as check_name,
  DISTINCT p.family_id as missing_family_id,
  COUNT(*) as profile_count,
  STRING_AGG(p.email, ', ') as profiles_using_this_family_id
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f WHERE f.id = p.family_id
  )
GROUP BY p.family_id
ORDER BY profile_count DESC;

-- Check if any of these family_ids appear in activity_feed
SELECT 
  'Activity Feed Impact' as check_name,
  p.family_id as missing_family_id,
  COUNT(DISTINCT af.id) as activity_count
FROM profiles p
LEFT JOIN activity_feed af ON p.family_id = af.family_id
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f WHERE f.id = p.family_id
  )
GROUP BY p.family_id;
