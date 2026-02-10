-- Check profiles table for role values and family relationships
-- This will help debug the "No parent found to notify" error

-- 1. Check all profiles with their roles and family_id
SELECT id, full_name, role, family_id
FROM profiles
ORDER BY family_id, role;

-- 2. Check for any NULL family_ids
SELECT COUNT(*) as null_family_count
FROM profiles
WHERE family_id IS NULL;

-- 3. Check distinct role values (case-sensitive)
SELECT DISTINCT role, COUNT(*) as count
FROM profiles
GROUP BY role;

-- 4. Check family relationships - find orphaned children (no parent in same family)
SELECT 
  c.id as child_id,
  c.full_name as child_name,
  c.family_id,
  p.id as parent_id,
  p.full_name as parent_name
FROM profiles c
LEFT JOIN profiles p ON c.family_id = p.family_id AND p.role = 'parent'
WHERE c.role = 'child';
