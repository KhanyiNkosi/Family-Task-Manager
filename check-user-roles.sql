-- CHECK USER ROLES IN PROFILES TABLE
-- Issue: Children loaded: Array(0) in console despite 3 family members
-- Need to verify role values

-- Check all family members and their roles
SELECT 
  id,
  full_name,
  role,
  email,
  family_id,
  created_at
FROM profiles
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'
ORDER BY role, full_name;

-- Count by role
SELECT 
  role,
  COUNT(*) as count
FROM profiles
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'
GROUP BY role;

-- Check if lwandlekometsi3132@gmail.com exists and their role
SELECT 
  id,
  full_name,
  role,
  email
FROM profiles
WHERE email = 'lwandlekometsi3132@gmail.com'
   OR id = '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0';
