-- =====================================================
-- FIX ACTIVITY COMMENTS DISPLAY
-- =====================================================
-- This adds the missing foreign key that allows comments
-- to join with profiles and show user names
-- =====================================================

-- Drop existing constraint if present
ALTER TABLE activity_comments 
DROP CONSTRAINT IF EXISTS activity_comments_user_id_fkey CASCADE;

-- Add the foreign key constraint
ALTER TABLE activity_comments 
ADD CONSTRAINT activity_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id) 
ON DELETE CASCADE;

-- Verify the constraint was added
SELECT 
  tc.constraint_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='activity_comments'
  AND tc.constraint_name = 'activity_comments_user_id_fkey';
