-- COMPREHENSIVE USER REFERENCE FINDER
-- This will find EVERY reference to the auth user IDs

-- First, identify the remaining user
DO $$
DECLARE
    remaining_user_id uuid;
    remaining_email text;
    table_name text;
    column_name text;
    ref_count int;
BEGIN
    -- Get the remaining user
    SELECT id, email INTO remaining_user_id, remaining_email
    FROM auth.users 
    WHERE email LIKE '%kometsi%'
    LIMIT 1;
    
    RAISE NOTICE 'Checking for references to user: % (%)', remaining_email, remaining_user_id;
    
    -- Check EVERY table in public schema for this user_id
    FOR table_name, column_name IN 
        SELECT t.table_name, c.column_name
        FROM information_schema.tables t
        JOIN information_schema.columns c ON c.table_name = t.table_name
        WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND c.column_name IN ('id', 'user_id', 'created_by', 'assigned_to', 'owner_id', 'parent_id')
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = $1', table_name, column_name)
        INTO ref_count
        USING remaining_user_id;
        
        IF ref_count > 0 THEN
            RAISE NOTICE 'Found % references in %.%', ref_count, table_name, column_name;
        END IF;
    END LOOP;
    
    -- Check auth schema tables
    RAISE NOTICE '--- Checking auth schema ---';
    
    SELECT COUNT(*) INTO ref_count FROM auth.identities WHERE user_id = remaining_user_id;
    IF ref_count > 0 THEN RAISE NOTICE 'auth.identities: %', ref_count; END IF;
    
    SELECT COUNT(*) INTO ref_count FROM auth.sessions WHERE user_id = remaining_user_id;
    IF ref_count > 0 THEN RAISE NOTICE 'auth.sessions: %', ref_count; END IF;
    
    SELECT COUNT(*) INTO ref_count FROM auth.refresh_tokens WHERE user_id = remaining_user_id;
    IF ref_count > 0 THEN RAISE NOTICE 'auth.refresh_tokens: %', ref_count; END IF;
    
    SELECT COUNT(*) INTO ref_count FROM auth.mfa_factors WHERE user_id = remaining_user_id;
    IF ref_count > 0 THEN RAISE NOTICE 'auth.mfa_factors: %', ref_count; END IF;
    
    SELECT COUNT(*) INTO ref_count FROM auth.mfa_challenges WHERE user_id IN (
        SELECT id FROM auth.mfa_factors WHERE user_id = remaining_user_id
    );
    IF ref_count > 0 THEN RAISE NOTICE 'auth.mfa_challenges: %', ref_count; END IF;
END $$;

-- Alternative: Query to find all foreign key constraints
SELECT
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (ccu.table_name = 'users' OR tc.table_name = 'users')
ORDER BY tc.table_name, kcu.column_name;

-- Check for triggers on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
    AND event_object_table = 'users'
ORDER BY trigger_name;
