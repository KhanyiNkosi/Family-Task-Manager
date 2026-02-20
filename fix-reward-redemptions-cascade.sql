-- Fix reward_redemptions to CASCADE delete when reward is deleted
-- This ensures that when a reward is deleted, all its redemptions are also deleted

-- Drop existing foreign key constraint
ALTER TABLE reward_redemptions 
DROP CONSTRAINT IF EXISTS reward_redemptions_reward_id_fkey;

-- Re-add with CASCADE delete
ALTER TABLE reward_redemptions
ADD CONSTRAINT reward_redemptions_reward_id_fkey
FOREIGN KEY (reward_id)
REFERENCES rewards(id)
ON DELETE CASCADE;

-- Verify the fix
SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'reward_redemptions'
AND kcu.column_name = 'reward_id';
