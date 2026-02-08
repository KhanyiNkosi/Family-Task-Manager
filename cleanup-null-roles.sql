-- =============================================================================
-- CLEANUP NULL ROLES AND ADD CONSTRAINTS
-- =============================================================================
-- Run this after confirming the reminder feature works
-- =============================================================================

-- Step 1: Check profiles with NULL roles (orphaned/inactive users)
SELECT '=== Profiles with NULL role ===' as info;
SELECT 
  id,
  email,
  full_name,
  family_id,
  created_at
FROM profiles
WHERE role IS NULL
ORDER BY created_at;

-- Step 2: Option A - Delete profiles with NULL role (if they're test/orphaned accounts)
-- UNCOMMENT IF YOU WANT TO DELETE THEM:
-- DELETE FROM profiles WHERE role IS NULL;

-- Step 2: Option B - Or assign them a default role (if they should be kept)
-- UNCOMMENT IF YOU WANT TO KEEP THEM AS CHILDREN:
-- UPDATE profiles 
-- SET role = 'child'
-- WHERE role IS NULL;

-- Step 3: After cleaning, verify all profiles have roles
SELECT '=== All Profiles (should all have roles now) ===' as info;
SELECT 
  role,
  full_name,
  family_id
FROM profiles
ORDER BY role, full_name;

-- Step 4: Add NOT NULL constraint (only after all roles are populated)
-- UNCOMMENT after choosing Option A or B above:
-- ALTER TABLE profiles 
-- ALTER COLUMN role SET NOT NULL;

-- Step 5: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_family_role ON profiles(family_id, role);

-- Step 6: Verify family structure
SELECT '=== Family Summary ===' as info;
SELECT 
  family_id,
  COUNT(*) FILTER (WHERE role = 'parent') as parents,
  COUNT(*) FILTER (WHERE role = 'child') as children,
  COUNT(*) FILTER (WHERE role IS NULL) as no_role
FROM profiles
GROUP BY family_id
ORDER BY parents DESC, children DESC;

SELECT '✅ Review the results and uncomment the cleanup option you prefer' as next_step;
