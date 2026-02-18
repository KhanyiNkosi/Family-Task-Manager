-- ============================================================================
-- Check Schemas for Deletion Script
-- ============================================================================
-- This queries the actual columns in each table to ensure safe deletion
-- ============================================================================

-- Check tasks table
SELECT 'tasks' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Check reward_redemptions table
SELECT 'reward_redemptions' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reward_redemptions'
ORDER BY ordinal_position;

-- Check rewards table
SELECT 'rewards' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'rewards'
ORDER BY ordinal_position;

-- Check notifications table
SELECT 'notifications' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;

-- Check bulletin_messages table
SELECT 'bulletin_messages' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bulletin_messages'
ORDER BY ordinal_position;

-- Check user_settings table
SELECT 'user_settings' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_settings'
ORDER BY ordinal_position;

-- Check user_profiles table
SELECT 'user_profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check profiles table
SELECT 'profiles' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
