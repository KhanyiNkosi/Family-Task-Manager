-- ============================================================================
-- CHECK CURRENT STATE - What still exists?
-- ============================================================================

-- Check User 1: kometsinkanyezi@gmail.com
SELECT 
  '👤 User 1: kometsinkanyezi' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
    THEN '❌ auth.users EXISTS'
    ELSE '✅ auth.users deleted'
  END as auth_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
    THEN '❌ profiles EXISTS'
    ELSE '✅ profiles deleted'
  END as profile_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946')
    THEN '❌ families EXISTS'
    ELSE '✅ families deleted'
  END as family_status;

-- Check User 2: nkazimulokometsi@gmail.com
SELECT 
  '👤 User 2: nkazimulo' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = 'a86f3d4b-8031-4586-9687-f57d20707634')
    THEN '❌ auth.users EXISTS'
    ELSE '✅ auth.users deleted'
  END as auth_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = 'a86f3d4b-8031-4586-9687-f57d20707634')
    THEN '❌ profiles EXISTS'
    ELSE '✅ profiles deleted'
  END as profile_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM families WHERE owner_id = 'a86f3d4b-8031-4586-9687-f57d20707634'
    )
    THEN '❌ families EXISTS'
    ELSE '✅ families deleted (or never existed)'
  END as family_status;

-- Show all remaining users
SELECT 
  '📋 ALL REMAINING USERS:' as section,
  COUNT(*) as total_users_in_auth
FROM auth.users;

SELECT 
  email,
  id::text as user_id,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
