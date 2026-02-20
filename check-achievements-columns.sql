-- Check what columns exist in achievements table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'achievements'
ORDER BY ordinal_position;
