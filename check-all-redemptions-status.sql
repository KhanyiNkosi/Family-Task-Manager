-- Comprehensive check of reward_redemptions table
-- Run this to see what's in your database

-- 1. Count redemptions by status
SELECT 
  status,
  COUNT(*) as count
FROM reward_redemptions
GROUP BY status
ORDER BY count DESC;

-- 2. Show all redemptions with details
SELECT 
  id,
  status,
  points_spent,
  redeemed_at,
  approved_at,
  user_id,
  reward_id,
  CASE 
    WHEN status = 'pending' THEN '🟡 Pending'
    WHEN status = 'approved' THEN '🟢 Approved (SHOULD BE DELETED)'
    WHEN status = 'rejected' THEN '🔴 Rejected (SHOULD BE DELETED)'
    ELSE '❓ Unknown'
  END as status_display
FROM reward_redemptions
ORDER BY redeemed_at DESC
LIMIT 20;

-- 3. If you see any approved/rejected, delete them ALL:
-- Uncomment and run:
-- DELETE FROM reward_redemptions WHERE status IN ('approved', 'rejected');

-- 4. After deletion, verify only pending remain:
-- SELECT status, COUNT(*) FROM reward_redemptions GROUP BY status;
