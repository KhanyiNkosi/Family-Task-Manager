-- CHECK USER_PROFILES TABLE
-- Issue: Code queries user_profiles table for role='child'
-- But child account has role in profiles table

-- Check if user_profiles table exists
SELECT EXISTS (
  SELECT FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'user_profiles'
);

-- If it exists, check what data is in it
SELECT 
  id,
  role,
  created_at,
  updated_at
FROM user_profiles
WHERE id = '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0';  -- Lwa (child)

-- Check all records in user_profiles
SELECT 
  id,
  role,
  created_at
FROM user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- Compare: profiles table has role
SELECT 
  id,
  full_name,
  role,
  email
FROM profiles
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'
ORDER BY role;
