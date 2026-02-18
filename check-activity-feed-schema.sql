-- Check the actual schema of activity_feed and tasks tables
-- to understand the data types

-- Check activity_feed schema
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'activity_feed'
ORDER BY ordinal_position;

-- Check tasks schema for family_id
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN ('family_id', 'assigned_to', 'id', 'created_at');

-- Check families table id type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'families'
  AND column_name = 'id';
