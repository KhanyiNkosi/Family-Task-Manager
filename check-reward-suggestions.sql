-- Check for reward suggestion notifications

-- Get current parent user (replace with actual user ID if known)
-- Or just check all notifications with action_url = '/rewards-store'

-- 1. Check all reward suggestion notifications in the database
SELECT 
    id,
    user_id,
    title,
    message,
    action_url,
    read,
    created_at,
    metadata
FROM notifications
WHERE action_url = '/rewards-store'
ORDER BY created_at DESC;

-- 2. Check if any parent has reward suggestions
SELECT 
    n.id,
    n.title,
    n.action_url,
    n.read,
    p.full_name as parent_name,
    p.email as parent_email,
    n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.action_url = '/rewards-store'
    AND p.role = 'parent'
ORDER BY n.created_at DESC;

-- 3. Check ALL notifications (to see if any exist)
SELECT 
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN action_url = '/rewards-store' THEN 1 END) as reward_suggestions,
    COUNT(CASE WHEN read = true THEN 1 END) as read_notifications,
    COUNT(CASE WHEN read = false THEN 1 END) as unread_notifications
FROM notifications;

-- 4. If no reward suggestions exist, check if they were deleted
-- (You can't see deleted data, but we can check if there are NO notifications at all)
SELECT 
    'No reward suggestions found' as status,
    'They may have been deleted or never created' as reason
WHERE NOT EXISTS (
    SELECT 1 FROM notifications WHERE action_url = '/rewards-store'
);

-- 5. Create 3 test reward suggestions for debugging (if none exist)
-- Replace USER_ID and FAMILY_ID with actual values
/*
INSERT INTO notifications (user_id, family_id, title, message, type, action_url, action_text, read, metadata)
VALUES 
(
    'YOUR_PARENT_USER_ID_HERE',
    'YOUR_FAMILY_ID_HERE',
    'New Reward Suggestion',
    'Your child suggested a new reward: Extra Screen Time',
    'reward',
    '/rewards-store',
    'Review Suggestion',
    false,
    '{"reward_name": "Extra Screen Time", "reward_description": "30 minutes extra on iPad", "suggested_points": 50, "suggested_by": "CHILD_USER_ID", "suggested_by_name": "Child Name"}'::jsonb
),
(
    'YOUR_PARENT_USER_ID_HERE',
    'YOUR_FAMILY_ID_HERE',
    'New Reward Suggestion',
    'Your child suggested a new reward: Pizza for Dinner',
    'reward',
    '/rewards-store',
    'Review Suggestion',
    false,
    '{"reward_name": "Pizza for Dinner", "reward_description": "Choose toppings for family pizza night", "suggested_points": 100, "suggested_by": "CHILD_USER_ID", "suggested_by_name": "Child Name"}'::jsonb
),
(
    'YOUR_PARENT_USER_ID_HERE',
    'YOUR_FAMILY_ID_HERE',
    'New Reward Suggestion',
    'Your child suggested a new reward: Movie Night',
    'reward',
    '/rewards-store',
    'Review Suggestion',
    false,
    '{"reward_name": "Movie Night", "reward_description": "Pick a movie for the family to watch", "suggested_points": 75, "suggested_by": "CHILD_USER_ID", "suggested_by_name": "Child Name"}'::jsonb
);
*/
