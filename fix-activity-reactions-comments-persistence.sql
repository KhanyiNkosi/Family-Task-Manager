-- FIX ACTIVITY REACTIONS AND COMMENTS PERSISTENCE
-- Issue: CASCADE DELETE removes reactions/comments when activity deleted
-- Solution: Keep reactions/comments even when activities are removed

-- 1. Drop and recreate foreign keys with NO ACTION instead of CASCADE
-- This prevents auto-deletion of reactions/comments

-- Drop existing CASCADE constraints
ALTER TABLE activity_reactions 
  DROP CONSTRAINT IF EXISTS activity_reactions_activity_id_fkey;

ALTER TABLE activity_comments 
  DROP CONSTRAINT IF EXISTS activity_comments_activity_id_fkey;

-- Recreate with NO ACTION (or use SET NULL if we add nullable activity_id)
-- For now, keep them orphaned so users can still see their past reactions
ALTER TABLE activity_reactions
  ADD CONSTRAINT activity_reactions_activity_id_fkey 
  FOREIGN KEY (activity_id) 
  REFERENCES activity_feed(id) 
  ON DELETE NO ACTION;

ALTER TABLE activity_comments
  ADD CONSTRAINT activity_comments_activity_id_fkey 
  FOREIGN KEY (activity_id) 
  REFERENCES activity_feed(id) 
  ON DELETE NO ACTION;

-- 2. Ensure RLS policies allow inserts and selects

-- Drop and recreate RLS policies for activity_reactions
DROP POLICY IF EXISTS "Family members can react" ON activity_reactions;
DROP POLICY IF EXISTS "Family members view reactions" ON activity_reactions;
DROP POLICY IF EXISTS "Users can delete own reactions" ON activity_reactions;

ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members view reactions"
  ON activity_reactions FOR SELECT
  TO authenticated
  USING (true);  -- Anyone can see reactions

CREATE POLICY "Family members can react"
  ON activity_reactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own reactions"
  ON activity_reactions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Drop and recreate RLS policies for activity_comments
DROP POLICY IF EXISTS "Family members can comment" ON activity_comments;
DROP POLICY IF EXISTS "Family members view comments" ON activity_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON activity_comments;

ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members view comments"
  ON activity_comments FOR SELECT
  TO authenticated
  USING (true);  -- Anyone can see comments

CREATE POLICY "Family members can comment"
  ON activity_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments"
  ON activity_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Verify policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('activity_reactions', 'activity_comments')
ORDER BY tablename, cmd, policyname;
