-- DIAGNOSE REMAINING AUTH USER DEPENDENCIES
-- Find what's preventing auth user deletion

-- 1. First, let's identify the remaining auth user(s)
SELECT id, email, created_at 
FROM auth.users 
WHERE email LIKE '%kometsi%'
ORDER BY created_at DESC;

-- Store the user IDs for the queries below
-- Replace these with actual IDs from the query above:
-- User 1: kometsinkanyezi@gmail.com (d86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3)
-- User 2: nkazimulokometsi@gmail.com (d8d0524f-fe0c-40ed-912b-9f1c17e8b5a3)
-- User 3: lwandlekometsi3132@gmail.com (5bdc3661-63e7-4fd9-ae08-d6acfb1322b0)

-- 2. Check all tables that might reference auth.users or profiles
-- (profiles reference auth.users, so check both)

-- Check profiles (should be 0)
SELECT 'profiles' as table_name, COUNT(*) as count
FROM profiles 
WHERE id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check user_settings (should be 0)
SELECT 'user_settings', COUNT(*)
FROM user_settings
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check user_achievements (should be 0)
SELECT 'user_achievements', COUNT(*)
FROM user_achievements
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check user_streaks (should be 0)
SELECT 'user_streaks', COUNT(*)
FROM user_streaks
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check user_levels (should be 0)
SELECT 'user_levels', COUNT(*)
FROM user_levels
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check activity_feed (should be 0)
SELECT 'activity_feed', COUNT(*)
FROM activity_feed
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check activity_reactions (should be 0)
SELECT 'activity_reactions', COUNT(*)
FROM activity_reactions
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check activity_comments (should be 0)
SELECT 'activity_comments', COUNT(*)
FROM activity_comments
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check notifications (should be 0)
SELECT 'notifications', COUNT(*)
FROM notifications
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check reward_redemptions (should be 0)
SELECT 'reward_redemptions', COUNT(*)
FROM reward_redemptions
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)

UNION ALL

-- Check tasks (by family_id since created_by doesn't exist)
SELECT 'tasks', COUNT(*)
FROM tasks
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'

UNION ALL

-- Check rewards (by family_id)
SELECT 'rewards', COUNT(*)
FROM rewards
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'

UNION ALL

-- Check bulletin_messages (by family_id)
SELECT 'bulletin_messages', COUNT(*)
FROM bulletin_messages
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316';

-- 3. Find all foreign keys that reference auth.users
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. Check auth.identities table (might have references)
SELECT 'auth.identities' as table_name, COUNT(*) as count
FROM auth.identities
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

-- 5. Check auth.sessions (might have active sessions)
SELECT 'auth.sessions' as table_name, COUNT(*) as count
FROM auth.sessions
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);
