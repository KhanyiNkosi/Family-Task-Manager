-- CHECK ACHIEVEMENTS SETUP
-- Diagnose why achievement badges are not displaying

-- 1. Check if achievements table has data
SELECT COUNT(*) as total_achievements FROM achievements;

-- 2. Show all achievements
SELECT 
  id,
  title,
  description,
  rarity,
  requirement_type,
  requirement_value,
  icon
FROM achievements
ORDER BY rarity, requirement_value
LIMIT 20;

-- 3. Check user_achievements for the test family
SELECT 
  ua.id,
  ua.user_id,
  p.full_name,
  p.role,
  a.title as achievement_title,
  ua.is_earned,
  ua.progress,
  ua.earned_at
FROM user_achievements ua
JOIN profiles p ON p.id = ua.user_id
JOIN achievements a ON a.id = ua.achievement_id
WHERE p.family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'
ORDER BY ua.earned_at DESC
LIMIT 20;

-- 4. Check if achievements table exists and has correct schema
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'achievements'
ORDER BY ordinal_position;
