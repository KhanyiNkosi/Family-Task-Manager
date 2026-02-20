-- ============================================================================
-- DIAGNOSE ROLE MISMATCH - Nkazimulo Kometsi
-- ============================================================================

-- 1. Check Nkazimulo's profile (by email)
SELECT 
  'User Profile' as check_name,
  id,
  email,
  full_name,
  role,
  family_id,
  created_at
FROM profiles
WHERE email = 'nkazimulokometsi@gmail.com';

-- 2. Check auth.users metadata (what they registered as)
SELECT 
  'Auth Metadata' as check_name,
  id,
  email,
  raw_user_meta_data->>'role' as signup_role,
  raw_user_meta_data->>'name' as signup_name,
  raw_user_meta_data->>'family_code' as family_code,
  created_at
FROM auth.users
WHERE email = 'nkazimulokometsi@gmail.com';

-- 3. Check if this family has any parents
SELECT 
  'Family Members' as check_name,
  p.id,
  p.email,
  p.full_name,
  p.role,
  f.owner_id as family_owner,
  CASE 
    WHEN p.id = f.owner_id THEN '✅ Family Owner'
    ELSE '👤 Member'
  END as ownership_status
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id = '58d9f6b0-c106-4524-811e-2508b5c51b71'
ORDER BY p.created_at;

-- 4. Check families table for this family
SELECT 
  'Family Details' as check_name,
  id,
  owner_id,
  created_at
FROM families
WHERE id = '58d9f6b0-c106-4524-811e-2508b5c51b71';

-- 5. Show the problem
SELECT 
  '❌ ROLE MISMATCH DETECTED' as issue,
  p.email,
  p.role as stored_role,
  u.raw_user_meta_data->>'role' as intended_role,
  CASE 
    WHEN p.role != COALESCE(u.raw_user_meta_data->>'role', 'child') 
    THEN '⚠️ FIX NEEDED'
    ELSE '✅ Correct'
  END as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'nkazimulokometsi@gmail.com';
