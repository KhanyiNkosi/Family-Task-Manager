-- List ALL constraints on the rewards table
SELECT 
    c.conname AS constraint_name,
    c.contype AS type,
    pg_get_constraintdef(c.oid) AS definition,
    CASE c.confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        ELSE c.confdeltype::text
    END AS on_delete_rule
FROM pg_constraint c
WHERE c.conrelid = 'public.rewards'::regclass
ORDER BY c.contype, c.conname;

-- Constraint types:
-- f = FOREIGN KEY
-- p = PRIMARY KEY
-- u = UNIQUE
-- c = CHECK
-- t = TRIGGER
