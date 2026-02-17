-- Update user registration limit from 500 to 2000

-- STEP 1: Check current limit
SELECT 
    setting_key,
    setting_value,
    description,
    updated_at
FROM app_settings 
WHERE setting_key = 'max_users';

-- STEP 2: Update the limit to 2000
UPDATE app_settings 
SET 
    setting_value = '{"limit": 2000, "enabled": true}'::jsonb,
    description = 'Maximum number of users allowed to register (2000 for expanded capacity)',
    updated_at = NOW()
WHERE setting_key = 'max_users';

-- STEP 3: Verify the update
SELECT 
    setting_key,
    setting_value,
    description,
    updated_at
FROM app_settings 
WHERE setting_key = 'max_users';

-- STEP 4: Check current user stats with new limit
SELECT * FROM public.get_user_stats();
