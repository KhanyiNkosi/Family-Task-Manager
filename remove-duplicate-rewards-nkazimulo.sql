-- ============================================================================
-- REMOVE DUPLICATE REWARDS FOR NKAZIMULO'S FAMILY
-- ============================================================================
-- Family ID: 58d9f6b0-c106-4524-811e-2508b5c51b71

-- First, check what rewards exist
SELECT 
  id,
  title,
  points_cost,
  family_id,
  created_at
FROM rewards
WHERE family_id = '58d9f6b0-c106-4524-811e-2508b5c51b71'
ORDER BY title, created_at;

-- Delete duplicates, keeping only the oldest reward of each type
-- This uses a subquery to identify which IDs to keep
DELETE FROM rewards
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      title,
      ROW_NUMBER() OVER (PARTITION BY title, family_id ORDER BY created_at ASC) as rn
    FROM rewards
    WHERE family_id = '58d9f6b0-c106-4524-811e-2508b5c51b71'
  ) sub
  WHERE rn > 1
);

-- Verify - should now have exactly 3 rewards
SELECT 
  'After Cleanup' as status,
  COUNT(*) as total_rewards,
  STRING_AGG(title, ', ' ORDER BY points_cost) as reward_titles
FROM rewards
WHERE family_id = '58d9f6b0-c106-4524-811e-2508b5c51b71';

-- Show remaining rewards
SELECT 
  id,
  title,
  points_cost,
  is_default,
  created_at
FROM rewards
WHERE family_id = '58d9f6b0-c106-4524-811e-2508b5c51b71'
ORDER BY points_cost;
