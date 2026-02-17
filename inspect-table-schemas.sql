-- Inspect table schemas to get correct column names

-- Check tasks table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Check reward_redemptions columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'reward_redemptions'
ORDER BY ordinal_position;

-- Check notifications columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check bulletin_messages columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'bulletin_messages'
ORDER BY ordinal_position;

-- Check user_settings columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'user_settings'
ORDER BY ordinal_position;
