-- 1. Check what redemptions actually exist in the database
SELECT 
    id,
    status,
    user_id,
    reward_id,
    points_spent,
    redeemed_at,
    approved_at,
    approved_by
FROM reward_redemptions
ORDER BY redeemed_at DESC
LIMIT 20;

-- 2. Check RLS policies on reward_redemptions (might be blocking DELETE)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'reward_redemptions'
ORDER BY cmd, policyname;

-- 3. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reward_redemptions' 
AND schemaname = 'public';

-- 4. Test if you can manually delete an approved redemption
-- Replace 'YOUR_REDEMPTION_ID' with one of the IDs showing as approved
-- DELETE FROM reward_redemptions WHERE id = 'YOUR_REDEMPTION_ID';

