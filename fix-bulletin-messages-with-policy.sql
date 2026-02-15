-- ============================================================================
-- FIX BULLETIN MESSAGES - Handle ALL RLS Policy Dependencies
-- ============================================================================
-- Step 1: Show existing policies
-- Step 2: Drop ALL dependent policies
-- Step 3: Alter column type UUID -> TEXT
-- Step 4: Recreate ALL policies with TEXT column
-- ============================================================================

-- Step 1: Show current policies (for reference)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bulletin_messages';

-- Step 2: Drop ALL dependent RLS policies
DROP POLICY IF EXISTS "Users can view their family bulletin messages" ON bulletin_messages;
DROP POLICY IF EXISTS "Users can create family bulletin messages" ON bulletin_messages;
DROP POLICY IF EXISTS "Users can update family bulletin messages" ON bulletin_messages;
DROP POLICY IF EXISTS "Users can delete family bulletin messages" ON bulletin_messages;
DROP POLICY IF EXISTS "family_view_bulletin_messages" ON bulletin_messages;
DROP POLICY IF EXISTS "family_create_bulletin_messages" ON bulletin_messages;
DROP POLICY IF EXISTS "family_update_bulletin_messages" ON bulletin_messages;
DROP POLICY IF EXISTS "family_delete_bulletin_messages" ON bulletin_messages;

-- Step 3: Alter the column type
ALTER TABLE bulletin_messages 
ALTER COLUMN family_id TYPE TEXT;

-- Step 4: Recreate ALL policies with TEXT column references

-- SELECT policy
CREATE POLICY "Users can view their family bulletin messages"
  ON bulletin_messages FOR SELECT
  USING (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- INSERT policy
CREATE POLICY "Users can create family bulletin messages"
  ON bulletin_messages FOR INSERT
  WITH CHECK (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update family bulletin messages"
  ON bulletin_messages FOR UPDATE
  USING (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete family bulletin messages"
  ON bulletin_messages FOR DELETE
  USING (
    family_id = (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Verify the change
SELECT 
  'bulletin_messages.family_id type:' as description,
  data_type as result
FROM information_schema.columns
WHERE table_name = 'bulletin_messages' 
  AND column_name = 'family_id';

-- Show recreated policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'bulletin_messages'
ORDER BY cmd, policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Successfully altered bulletin_messages.family_id to TEXT';
  RAISE NOTICE '✅ All RLS policies recreated with TEXT column reference';
  RAISE NOTICE '';
END $$;
