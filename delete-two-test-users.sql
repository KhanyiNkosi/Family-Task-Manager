-- Delete two test users: nkosik8@gmail.com & kometsilwandle@gmail.com
-- This will cascade through all related tables

-- ====================================
-- STEP 1: View the users to be deleted
-- ====================================
SELECT 
    id,
    email,
    created_at
FROM auth.users 
WHERE email IN ('nkosik8@gmail.com', 'kometsilwandle@gmail.com')
ORDER BY email;

-- ====================================
-- STEP 2: View their profiles and families
-- ====================================
SELECT 
    p.id as profile_id,
    p.user_id,
    p.name,
    p.role,
    p.family_id,
    f.name as family_name,
    f.invitation_code
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN public.families f ON p.family_id = f.id
WHERE u.email IN ('nkosik8@gmail.com', 'kometsilwandle@gmail.com')
ORDER BY u.email;

-- ====================================
-- STEP 3: Delete user 1 (nkosik8@gmail.com)
-- ====================================

-- Get the user ID (replace this after running STEP 1)
DO $$
DECLARE
    v_user_id uuid;
    v_family_id uuid;
BEGIN
    -- Find user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'nkosik8@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User nkosik8@gmail.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Deleting user: %', v_user_id;
    
    -- Get family ID
    SELECT family_id INTO v_family_id 
    FROM public.profiles 
    WHERE user_id = v_user_id;
    
    -- Delete dependent data for this user
    DELETE FROM public.reward_redemptions WHERE user_id = v_user_id;
    DELETE FROM public.tasks WHERE user_id = v_user_id OR assigned_to = v_user_id;
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    DELETE FROM public.bulletin_messages WHERE family_id = v_family_id;
    DELETE FROM public.user_settings WHERE user_id = v_user_id;
    
    -- Delete rewards for this family (CASCADE will handle this, but being explicit)
    IF v_family_id IS NOT NULL THEN
        DELETE FROM public.rewards WHERE family_id = v_family_id;
        DELETE FROM public.families WHERE id = v_family_id;
    END IF;
    
    -- Delete profile
    DELETE FROM public.profiles WHERE user_id = v_user_id;
    
    -- Delete auth user
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Successfully deleted user: nkosik8@gmail.com';
END $$;

-- ====================================
-- STEP 4: Delete user 2 (kometsilwandle@gmail.com)
-- ====================================

DO $$
DECLARE
    v_user_id uuid;
    v_family_id uuid;
BEGIN
    -- Find user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'kometsilwandle@gmail.com';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'User kometsilwandle@gmail.com not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Deleting user: %', v_user_id;
    
    -- Get family ID
    SELECT family_id INTO v_family_id 
    FROM public.profiles 
    WHERE user_id = v_user_id;
    
    -- Delete dependent data for this user
    DELETE FROM public.reward_redemptions WHERE user_id = v_user_id;
    DELETE FROM public.tasks WHERE user_id = v_user_id OR assigned_to = v_user_id;
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    DELETE FROM public.bulletin_messages WHERE family_id = v_family_id;
    DELETE FROM public.user_settings WHERE user_id = v_user_id;
    
    -- Delete rewards for this family (CASCADE will handle this, but being explicit)
    IF v_family_id IS NOT NULL THEN
        DELETE FROM public.rewards WHERE family_id = v_family_id;
        DELETE FROM public.families WHERE id = v_family_id;
    END IF;
    
    -- Delete profile
    DELETE FROM public.profiles WHERE user_id = v_user_id;
    
    -- Delete auth user
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Successfully deleted user: kometsilwandle@gmail.com';
END $$;

-- ====================================
-- STEP 5: Verify deletion
-- ====================================

-- Should return 0 rows
SELECT 
    id,
    email
FROM auth.users 
WHERE email IN ('nkosik8@gmail.com', 'kometsilwandle@gmail.com');

-- Check total user count
SELECT 
    COUNT(*) as total_users_remaining,
    COUNT(CASE WHEN email LIKE '%@gmail.com%' THEN 1 END) as gmail_users
FROM auth.users;
