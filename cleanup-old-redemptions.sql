-- Check for and clean up old approved/rejected redemptions
-- These should have been deleted but may be lingering from before the fix

-- First, see what we have
SELECT 
  id,
  status,
  redeemed_at,
  approved_at,
  user_id,
  reward_id
FROM reward_redemptions
WHERE status IN ('approved', 'rejected')
ORDER BY redeemed_at DESC;

-- To clean them up, uncomment and run this:
-- DELETE FROM reward_redemptions 
-- WHERE status IN ('approved', 'rejected');

-- Verify only pending redemptions remain:
-- SELECT status, COUNT(*) as count
-- FROM reward_redemptions
-- GROUP BY status;
