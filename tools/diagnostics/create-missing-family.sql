-- Fix: Create missing family record
-- Run this in Supabase SQL Editor

-- Check what family_ids exist in profiles
SELECT DISTINCT family_id, COUNT(*) as member_count
FROM profiles
WHERE family_id IS NOT NULL
GROUP BY family_id;

-- Create the missing family (use the family_id from profiles)
INSERT INTO families (id, name, created_at)
VALUES 
  ('32af85db-12f6-4d60-9995-f585aa973ba3', 'Nkosi Family', NOW())
ON CONFLICT (id) DO NOTHING;

-- Verify the family was created
SELECT * FROM families;

-- Verify profiles now have valid family_id
SELECT p.id, p.full_name, p.role, p.family_id, f.name as family_name
FROM profiles p
LEFT JOIN families f ON f.id = p.family_id::text
WHERE p.family_id IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Family record created successfully!';
  RAISE NOTICE 'Now task completion and activity feed triggers should work.';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test by:';
  RAISE NOTICE '1. Have child complete a task';
  RAISE NOTICE '2. Check activity_feed table for new entry';
  RAISE NOTICE '3. Have parent approve the task';
  RAISE NOTICE '4. Check activity_feed again for approval entry';
END $$;
