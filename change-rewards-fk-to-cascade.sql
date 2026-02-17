-- STEP 1: Verify current FK configuration (should show SET NULL)
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition,
    confdeltype AS on_delete_action
FROM pg_constraint 
WHERE conname = 'rewards_family_id_fkey';

-- STEP 2: Drop the existing FK constraint with SET NULL behavior
ALTER TABLE public.rewards 
DROP CONSTRAINT rewards_family_id_fkey;

-- STEP 3: Recreate the FK constraint with ON DELETE CASCADE
ALTER TABLE public.rewards 
ADD CONSTRAINT rewards_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

-- STEP 4: Verify the FK is now configured with CASCADE
SELECT 
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS on_delete_rule
FROM pg_constraint 
WHERE conname = 'rewards_family_id_fkey';

-- Expected result: on_delete_rule should now be 'CASCADE'
