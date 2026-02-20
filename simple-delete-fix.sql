-- SIMPLE FIX: Just delete from profiles table with CASCADE
-- This might trigger auth.users deletion automatically

-- Get the remaining user info
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.id as profile_id,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email LIKE '%kometsi%';

-- Try deleting the profile with CASCADE
-- This might cascade to auth.users if the FK is set up that way
DELETE FROM profiles 
WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE '%kometsi%'
);

-- Check if user still exists
SELECT COUNT(*) as remaining_users
FROM auth.users 
WHERE email LIKE '%kometsi%';

-- If user still exists, it means profiles table is already empty
-- In that case, the issue is in auth schema tables

-- Check auth schema
SELECT 
    (SELECT COUNT(*) FROM auth.identities WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%')) as identities,
    (SELECT COUNT(*) FROM auth.sessions WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%')) as sessions,
    (SELECT COUNT(*) FROM auth.refresh_tokens WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%')) as refresh_tokens,
    (SELECT COUNT(*) FROM auth.mfa_factors WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%')) as mfa_factors;

-- Delete all auth-related data
DELETE FROM auth.mfa_challenges 
WHERE factor_id IN (
    SELECT id FROM auth.mfa_factors 
    WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%')
);

DELETE FROM auth.mfa_factors 
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%');

DELETE FROM auth.refresh_tokens 
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%');

DELETE FROM auth.sessions 
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%');

DELETE FROM auth.identities 
WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%kometsi%');

-- Now try deleting user again (via Dashboard after running this)
-- Or try SQL:
DELETE FROM auth.users WHERE email LIKE '%kometsi%';

-- Final verification
SELECT COUNT(*) as remaining FROM auth.users WHERE email LIKE '%kometsi%';
