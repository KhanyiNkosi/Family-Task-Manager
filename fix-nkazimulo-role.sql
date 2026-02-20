-- ============================================================================
-- FIX ROLE MISMATCH - Change Nkazimulo from child to parent
-- ============================================================================

-- This fixes the role assignment bug where user registered as parent
-- but was stored as child in the database

-- STEP 1: Update profile role to 'parent'
UPDATE profiles
SET 
  role = 'parent',
  updated_at = NOW()
WHERE email = 'nkazimulokometsi@gmail.com';

-- STEP 2: Update user_profiles table (if exists)
UPDATE user_profiles
SET role = 'parent'
WHERE id = (SELECT id FROM profiles WHERE email = 'nkazimulokometsi@gmail.com');

-- STEP 3: Verify the fix
SELECT 
  '✅ Role Fixed' as result,
  p.id,
  p.email,
  p.full_name,
  p.role as new_role,
  u.raw_user_meta_data->>'role' as signup_role,
  CASE 
    WHEN p.role = COALESCE(u.raw_user_meta_data->>'role', 'child') 
    THEN '✅ MATCHED'
    ELSE '❌ STILL MISMATCHED'
  END as verification
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'nkazimulokometsi@gmail.com';

-- STEP 4: Check family ownership
SELECT 
  'Family Status' as check_name,
  f.id as family_id,
  f.owner_id,
  p.id as user_id,
  p.email,
  p.role,
  CASE 
    WHEN f.owner_id = p.id THEN '✅ Is Owner'
    ELSE '⚠️ Not Owner'
  END as owner_status
FROM profiles p
JOIN families f ON p.family_id = f.id
WHERE p.email = 'nkazimulokometsi@gmail.com';
