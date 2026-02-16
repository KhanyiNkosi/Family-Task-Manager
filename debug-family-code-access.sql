-- ============================================================================
-- QUICK DIAGNOSTIC: Check specific user's family code
-- ============================================================================
-- Run this and share the user's email to debug
-- ============================================================================

-- Check all recent users and their family status
SELECT 
  SUBSTRING(p.email, 1, 40) as email,
  p.role,
  p.family_id as profile_family_id,
  f.id as families_table_id,
  f.owner_id,
  CASE 
    WHEN p.family_id IS NULL THEN '❌ profiles.family_id is NULL'
    WHEN f.id IS NULL THEN '⚠️ family_id exists but NO matching family in families table'
    ELSE '✅ GOOD: Has family_id and family exists'
  END as status,
  p.created_at
FROM profiles p
LEFT JOIN families f ON p.family_id::text = f.id
WHERE p.role = 'parent'
ORDER BY p.created_at DESC
LIMIT 10;

-- Check if there are RLS issues preventing reads
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('profiles', 'families')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
