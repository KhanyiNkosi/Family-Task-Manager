-- ============================================================================
-- SOLUTION A: Add ON DELETE CASCADE to rewards.family_id
-- ============================================================================
-- This will automatically delete all rewards when a family is deleted
-- Run the inspection script first to see the current constraint name

-- Step 1: Drop the existing foreign key constraint
-- Replace 'rewards_family_id_fkey' with the actual constraint name from inspection
ALTER TABLE public.rewards
DROP CONSTRAINT IF EXISTS rewards_family_id_fkey;

-- Step 2: Add the foreign key back with CASCADE delete
ALTER TABLE public.rewards
ADD CONSTRAINT rewards_family_id_fkey
FOREIGN KEY (family_id)
REFERENCES public.families(id)
ON DELETE CASCADE;

-- Verify the change
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'rewards'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'family_id';

-- Test by checking what would happen (don't actually delete!)
-- This should show rewards that would be cascade deleted
SELECT 
  f.id as family_id,
  f.family_code,
  COUNT(r.id) as rewards_count,
  'These rewards would be auto-deleted if family deleted' as note
FROM families f
LEFT JOIN rewards r ON r.family_id = f.id
GROUP BY f.id, f.family_code
HAVING COUNT(r.id) > 0;
