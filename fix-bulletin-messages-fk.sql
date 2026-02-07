-- ============================================================================
-- FIX BULLETIN MESSAGES FOREIGN KEY
-- Run this if you already created bulletin_messages table with wrong FK
-- ============================================================================

-- Drop the old foreign key constraint
ALTER TABLE bulletin_messages 
  DROP CONSTRAINT IF EXISTS bulletin_messages_posted_by_fkey;

-- Add the correct foreign key to profiles table
ALTER TABLE bulletin_messages
  ADD CONSTRAINT bulletin_messages_posted_by_fkey 
  FOREIGN KEY (posted_by) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- Verify the constraint
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS references_table
FROM pg_constraint
WHERE conname = 'bulletin_messages_posted_by_fkey';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ BULLETIN MESSAGES FOREIGN KEY FIXED!';
  RAISE NOTICE '';
  RAISE NOTICE 'The posted_by column now correctly references profiles(id)';
  RAISE NOTICE 'This allows the JOIN query: poster:profiles!posted_by(full_name)';
  RAISE NOTICE '';
END $$;
