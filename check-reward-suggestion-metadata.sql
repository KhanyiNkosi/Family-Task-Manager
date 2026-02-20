-- Check the reward suggestion metadata structure

-- 1. Get the full structure of the reward suggestion
SELECT 
    id,
    user_id,
    title,
    message,
    action_url,
    read,
    created_at,
    metadata,
    -- Check specific metadata fields
    metadata->>'reward_name' as reward_name,
    metadata->>'reward_description' as reward_description,
    metadata->>'suggested_points' as suggested_points,
    metadata->>'suggested_by' as suggested_by,
    metadata->>'suggested_by_name' as suggested_by_name
FROM notifications
WHERE action_url = '/rewards-store'
ORDER BY created_at DESC;

-- 2. Check if metadata exists and has the right structure
SELECT 
    id,
    title,
    CASE 
        WHEN metadata IS NULL THEN 'Metadata is NULL'
        WHEN metadata->>'reward_name' IS NULL THEN 'Missing reward_name'
        WHEN metadata->>'suggested_points' IS NULL THEN 'Missing suggested_points'
        ELSE 'Metadata looks good'
    END as metadata_status
FROM notifications
WHERE action_url = '/rewards-store';

-- 3. Get the parent user to verify it's querying the right user
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.role,
    p.family_id
FROM profiles p
WHERE p.role = 'parent'
ORDER BY p.created_at DESC;
