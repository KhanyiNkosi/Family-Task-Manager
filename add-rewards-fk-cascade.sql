-- STEP 1: Verify no existing FK constraint (should return 0 rows)
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%family%';

-- STEP 2: Check if there are any rewards with invalid family_id (orphaned data)
-- This should return 0 rows if data is clean
SELECT r.id, r.family_id, r.name
FROM public.rewards r
LEFT JOIN public.families f ON r.family_id = f.id
WHERE r.family_id IS NOT NULL 
    AND f.id IS NULL;

-- STEP 3: Add the FK constraint with ON DELETE CASCADE
-- This will automatically delete rewards when their family is deleted
ALTER TABLE public.rewards 
ADD CONSTRAINT rewards_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

-- STEP 4: Verify the FK was created with CASCADE rule
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'rewards' 
    AND kcu.column_name = 'family_id';
