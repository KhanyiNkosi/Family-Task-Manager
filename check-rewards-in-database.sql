-- Check rewards in database

-- 1. Get the parent user info
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.family_id,
    p.role
FROM profiles p
WHERE p.email = 'nkosik8@gmail.com';

-- Expected: user_id = e0e1a470-24be-4678-98ed-7a43e702428b
--           family_id = 3752650d-8bea-429b-bab4-103c6e9f0b95

-- 2. Check ALL rewards for this family
SELECT 
    id,
    title,
    description,
    points_cost,
    family_id,
    is_active,
    is_default,
    created_at
FROM rewards
WHERE family_id = '3752650d-8bea-429b-bab4-103c6e9f0b95'
ORDER BY created_at DESC;

-- 3. Check if there are ANY rewards in the database at all
SELECT 
    COUNT(*) as total_rewards,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_rewards,
    COUNT(CASE WHEN is_default = true THEN 1 END) as default_rewards,
    COUNT(DISTINCT family_id) as unique_families
FROM rewards;

-- 4. Check if default rewards exist (the 3 auto-loaded ones)
SELECT 
    id,
    title,
    description,
    points_cost,
    family_id,
    is_active,
    is_default,
    created_at
FROM rewards
WHERE is_default = true
ORDER BY points_cost ASC;

-- 5. If no default rewards exist, create them
-- (Default rewards that should be auto-loaded for all families)
/*
INSERT INTO rewards (title, description, points_cost, family_id, created_by, is_active, is_default)
SELECT 
    'Extra Screen Time',
    '30 minutes of extra screen time',
    50,
    '3752650d-8bea-429b-bab4-103c6e9f0b95',
    'e0e1a470-24be-4678-98ed-7a43e702428b',
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM rewards 
    WHERE family_id = '3752650d-8bea-429b-bab4-103c6e9f0b95' 
    AND title = 'Extra Screen Time'
);

INSERT INTO rewards (title, description, points_cost, family_id, created_by, is_active, is_default)
SELECT 
    'Choose Dinner',
    'Pick what the family eats for dinner',
    100,
    '3752650d-8bea-429b-bab4-103c6e9f0b95',
    'e0e1a470-24be-4678-98ed-7a43e702428b',
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM rewards 
    WHERE family_id = '3752650d-8bea-429b-bab4-103c6e9f0b95' 
    AND title = 'Choose Dinner'
);

INSERT INTO rewards (title, description, points_cost, family_id, created_by, is_active, is_default)
SELECT 
    'Movie Night',
    'Pick a movie for family movie night',
    150,
    '3752650d-8bea-429b-bab4-103c6e9f0b95',
    'e0e1a470-24be-4678-98ed-7a43e702428b',
    true,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM rewards 
    WHERE family_id = '3752650d-8bea-429b-bab4-103c6e9f0b95' 
    AND title = 'Movie Night'
);
*/

-- Verify insertion
SELECT 
    id,
    title,
    points_cost,
    is_default,
    created_at
FROM rewards
WHERE family_id = '3752650d-8bea-429b-bab4-103c6e9f0b95'
ORDER BY points_cost ASC;
