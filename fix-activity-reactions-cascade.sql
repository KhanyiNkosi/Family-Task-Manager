-- Fix activity_feed deletion by setting CASCADE on activity_reactions foreign key

-- Check the current foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'activity_reactions'
AND kcu.column_name = 'activity_id';

-- Drop the existing foreign key constraint
ALTER TABLE activity_reactions
DROP CONSTRAINT IF EXISTS activity_reactions_activity_id_fkey;

-- Re-create it with CASCADE DELETE
ALTER TABLE activity_reactions
ADD CONSTRAINT activity_reactions_activity_id_fkey
FOREIGN KEY (activity_id)
REFERENCES activity_feed(id)
ON DELETE CASCADE;

-- Verify the fix
SELECT
    rc.constraint_name,
    kcu.table_name,
    kcu.column_name,
    rc.delete_rule
FROM information_schema.referential_constraints rc
JOIN information_schema.key_column_usage kcu
  ON rc.constraint_name = kcu.constraint_name
WHERE kcu.table_name = 'activity_reactions'
AND kcu.column_name = 'activity_id';
