-- Fix activity_feed RLS policies to allow DELETE operations

-- First, check existing policies
SELECT 
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'activity_feed'
ORDER BY cmd, policyname;

-- Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "activity_feed_delete" ON activity_feed;
DROP POLICY IF EXISTS "activity_feed_delete_policy" ON activity_feed;
DROP POLICY IF EXISTS "delete_own_activity" ON activity_feed;

-- Create a comprehensive DELETE policy
-- Parents can delete activities in their family, users can delete their own
CREATE POLICY "activity_feed_delete_policy" ON activity_feed
FOR DELETE
TO authenticated
USING (
  -- User can delete their own activity
  auth.uid() = user_id
  OR
  -- Parent can delete activities in their family
  EXISTS (
    SELECT 1 FROM profiles parent
    WHERE parent.id = auth.uid()
    AND parent.role = 'parent'
    AND parent.family_id = (
      SELECT family_id FROM profiles WHERE id = activity_feed.user_id
    )
  )
);

-- Verify the new policy
SELECT 
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'activity_feed'
AND cmd = 'DELETE'
ORDER BY policyname;
