-- ============================================================================
-- MANUAL PROFILE CREATION SCRIPT
-- ============================================================================
-- This script manually creates profiles for existing users
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Check current state
SELECT 'Current Profiles:' as status;
SELECT id, email, full_name, role, family_id FROM profiles;

SELECT 'Current User Profiles:' as status;
SELECT id, role, total_points FROM user_profiles;

-- Step 2: Generate a family ID (run this first, save the result)
SELECT gen_random_uuid() as new_family_id;

-- Step 3: After getting the family_id from above, replace 'YOUR-FAMILY-ID-HERE' below
-- Then run the INSERT statements

-- ⚠️ IMPORTANT: Replace 'YOUR-FAMILY-ID-HERE' with the UUID from Step 2
-- ⚠️ IMPORTANT: Replace the user IDs with actual IDs from user_profiles table above

/*
-- Example: Create parent profile
INSERT INTO profiles (id, email, full_name, role, family_id)
VALUES (
  '081a3483-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- Replace with actual parent user ID
  'parent@example.com',
  'Parent Name',
  'parent',
  'YOUR-FAMILY-ID-HERE'  -- Replace with UUID from Step 2
)
ON CONFLICT (id) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  role = EXCLUDED.role;

-- Example: Create child profile (use SAME family_id as parent)
INSERT INTO profiles (id, email, full_name, role, family_id)
VALUES (
  '17eb2a70-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- Replace with actual child user ID
  'child@example.com',
  'Child Name',
  'child',
  'YOUR-FAMILY-ID-HERE'  -- Use SAME family_id as parent!
)
ON CONFLICT (id) DO UPDATE SET
  family_id = EXCLUDED.family_id,
  role = EXCLUDED.role;
*/

-- Step 4: Verify the profiles were created
SELECT 'Final Profiles:' as status;
SELECT id, email, full_name, role, family_id FROM profiles ORDER BY role;

-- Step 5: Verify family relationships
SELECT 
  p.family_id,
  COUNT(*) FILTER (WHERE p.role = 'parent') as parents,
  COUNT(*) FILTER (WHERE p.role = 'child') as children
FROM profiles p
GROUP BY p.family_id;
