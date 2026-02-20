-- Check if user_achievements table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_achievements'
ORDER BY ordinal_position;
