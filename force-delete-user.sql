-- FORCE DELETE AUTH USER (NUCLEAR OPTION)
-- This attempts to delete the user by temporarily disabling triggers
-- and using CASCADE where possible

-- Get the remaining user ID
DO $$
DECLARE
    remaining_user_id uuid;
BEGIN
    -- Find the user
    SELECT id INTO remaining_user_id
    FROM auth.users 
    WHERE email LIKE '%kometsi%'
    LIMIT 1;
    
    RAISE NOTICE 'Attempting to delete user: %', remaining_user_id;
    
    -- Delete from auth.mfa_challenges first (if exists)
    DELETE FROM auth.mfa_challenges 
    WHERE factor_id IN (SELECT id FROM auth.mfa_factors WHERE user_id = remaining_user_id);
    RAISE NOTICE 'Deleted mfa_challenges';
    
    -- Delete from auth.mfa_factors
    DELETE FROM auth.mfa_factors WHERE user_id = remaining_user_id;
    RAISE NOTICE 'Deleted mfa_factors';
    
    -- Delete from auth.refresh_tokens
    DELETE FROM auth.refresh_tokens WHERE user_id = remaining_user_id;
    RAISE NOTICE 'Deleted refresh_tokens';
    
    -- Delete from auth.sessions
    DELETE FROM auth.sessions WHERE user_id = remaining_user_id;
    RAISE NOTICE 'Deleted sessions';
    
    -- Delete from auth.identities
    DELETE FROM auth.identities WHERE user_id = remaining_user_id;
    RAISE NOTICE 'Deleted identities';
    
    -- Delete from auth.audit_log_entries (if referencing this user)
    DELETE FROM auth.audit_log_entries WHERE id = remaining_user_id;
    RAISE NOTICE 'Deleted audit_log_entries';
    
    -- Try one more time from public.profiles (in case it was recreated)
    DELETE FROM profiles WHERE id = remaining_user_id;
    RAISE NOTICE 'Deleted from profiles';
    
    -- Now try to delete from auth.users
    BEGIN
        DELETE FROM auth.users WHERE id = remaining_user_id;
        RAISE NOTICE '✅ Successfully deleted user from auth.users';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to delete from auth.users: %', SQLERRM;
        
        -- If it still fails, show what's referencing it
        RAISE NOTICE 'Checking remaining references...';
        
        -- Manual checks for common tables
        PERFORM 1 FROM profiles WHERE id = remaining_user_id LIMIT 1;
        IF FOUND THEN RAISE NOTICE 'Still referenced in: profiles'; END IF;
        
        PERFORM 1 FROM auth.identities WHERE user_id = remaining_user_id LIMIT 1;
        IF FOUND THEN RAISE NOTICE 'Still referenced in: auth.identities'; END IF;
        
        PERFORM 1 FROM auth.sessions WHERE user_id = remaining_user_id LIMIT 1;
        IF FOUND THEN RAISE NOTICE 'Still referenced in: auth.sessions'; END IF;
    END;
END $$;

-- Verify deletion
SELECT 
    'auth.users' as location,
    COUNT(*) as remaining
FROM auth.users 
WHERE email LIKE '%kometsi%'
UNION ALL
SELECT 
    'profiles',
    COUNT(*)
FROM profiles
WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE '%kometsi%'
);
