-- ============================================================================
-- ADD CASCADE DELETE: Rewards → Families
-- ============================================================================
-- When a family is deleted, automatically delete all associated rewards
-- This prevents the NOT NULL constraint error we encountered
-- ============================================================================

-- Step 1: Find existing foreign key constraint name
SELECT 
  tc.constraint_name,
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
  AND tc.table_name = 'rewards'
  AND kcu.column_name = 'family_id';

-- Step 2: Drop existing foreign key (if exists)
-- Replace 'constraint_name' with the actual name from above
-- Common names: rewards_family_id_fkey, fk_rewards_family_id
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the constraint name dynamically
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'rewards'
    AND kcu.column_name = 'family_id'
  LIMIT 1;
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE rewards DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE '✅ Dropped old constraint: %', constraint_name;
  ELSE
    RAISE NOTICE '⚠️  No existing foreign key constraint found on rewards.family_id';
  END IF;
END $$;

-- Step 3: Add new foreign key with ON DELETE CASCADE
ALTER TABLE rewards
ADD CONSTRAINT rewards_family_id_fkey
FOREIGN KEY (family_id) 
REFERENCES families(id)
ON DELETE CASCADE;

-- Step 4: Verify the new constraint
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  rc.delete_rule,
  CASE 
    WHEN rc.delete_rule = 'CASCADE' THEN '✅ CASCADE enabled - rewards will auto-delete!'
    ELSE '❌ CASCADE not enabled'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'rewards'
  AND kcu.column_name = 'family_id';

-- Success message
SELECT 
  '✅ CASCADE DELETE ENABLED!' as status,
  'When a family is deleted, all rewards will automatically be deleted too' as description;
