-- Check existing RLS policies on reward_redemptions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'reward_redemptions'
ORDER BY cmd, policyname;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "reward_redemptions_select" ON reward_redemptions;
DROP POLICY IF EXISTS "reward_redemptions_insert" ON reward_redemptions;
DROP POLICY IF EXISTS "reward_redemptions_update" ON reward_redemptions;
DROP POLICY IF EXISTS "reward_redemptions_delete" ON reward_redemptions;

-- Create comprehensive policies for reward_redemptions table

-- SELECT: Users can see redemptions in their family
CREATE POLICY "reward_redemptions_select" ON reward_redemptions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.family_id = (
      SELECT family_id FROM profiles WHERE id = reward_redemptions.user_id
    )
  )
);

-- INSERT: Children can create redemptions for themselves
CREATE POLICY "reward_redemptions_insert" ON reward_redemptions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- UPDATE: Parents can update redemptions in their family
CREATE POLICY "reward_redemptions_update" ON reward_redemptions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'parent'
    AND profiles.family_id = (
      SELECT family_id FROM profiles WHERE id = reward_redemptions.user_id
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'parent'
    AND profiles.family_id = (
      SELECT family_id FROM profiles WHERE id = reward_redemptions.user_id
    )
  )
);

-- DELETE: Parents can delete redemptions in their family
CREATE POLICY "reward_redemptions_delete" ON reward_redemptions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'parent'
    AND profiles.family_id = (
      SELECT family_id FROM profiles WHERE id = reward_redemptions.user_id
    )
  )
);

-- Verify the new policies
SELECT 
    policyname,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'reward_redemptions'
ORDER BY cmd, policyname;
