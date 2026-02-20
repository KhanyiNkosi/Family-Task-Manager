-- Create 3 default rewards for family: 3752650d-8bea-429b-bab4-103c6e9f0b95
-- User: e0e1a470-24be-4678-98ed-7a43e702428b (nkosik8@gmail.com)

INSERT INTO rewards (title, description, points_cost, family_id, created_by, is_active, is_default)
VALUES 
(
    '🍦 Ice Cream Treat',
    'Enjoy a delicious ice cream treat!',
    20,
    '3752650d-8bea-429b-bab4-103c6e9f0b95',
    'e0e1a470-24be-4678-98ed-7a43e702428b',
    true,
    true
),
(
    '📱 30 Mins Screen Time',
    'Extra 30 minutes of screen time for your favorite activity!',
    30,
    '3752650d-8bea-429b-bab4-103c6e9f0b95',
    'e0e1a470-24be-4678-98ed-7a43e702428b',
    true,
    true
),
(
    '🎮 1 Hour Video Games',
    'One full hour to play your favorite video games!',
    50,
    '3752650d-8bea-429b-bab4-103c6e9f0b95',
    'e0e1a470-24be-4678-98ed-7a43e702428b',
    true,
    true
);

-- Verify they were created
SELECT 
    id,
    title,
    description,
    points_cost,
    is_active,
    is_default,
    created_at
FROM rewards
WHERE family_id = '3752650d-8bea-429b-bab4-103c6e9f0b95'
ORDER BY points_cost ASC;
