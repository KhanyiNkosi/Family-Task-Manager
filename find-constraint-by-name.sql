-- Find the constraint by exact name across the entire database
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action,
    confupdtype AS on_update_action
FROM pg_constraint 
WHERE conname = 'rewards_family_id_fkey';

-- Decode the action codes:
-- a = NO ACTION
-- r = RESTRICT  
-- c = CASCADE
-- n = SET NULL
-- d = SET DEFAULT
