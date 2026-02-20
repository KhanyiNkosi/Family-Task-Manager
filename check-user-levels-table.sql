-- Check if user_levels table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_levels'
ORDER BY ordinal_position;
