-- Create reward_redemptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reward_redemptions table
DROP POLICY IF EXISTS "Users can view family reward redemptions" ON reward_redemptions;
CREATE POLICY "Users can view family reward redemptions"
  ON reward_redemptions FOR SELECT
  USING (
    user_id IN (
      SELECT p.id FROM profiles p
      WHERE p.family_id IN (
        SELECT family_id FROM profiles WHERE id = (SELECT auth.uid())::uuid
      )
    )
  );

DROP POLICY IF EXISTS "Children can create redemptions" ON reward_redemptions;
CREATE POLICY "Children can create redemptions"
  ON reward_redemptions FOR INSERT
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

DROP POLICY IF EXISTS "Parents can update redemptions" ON reward_redemptions;
CREATE POLICY "Parents can update redemptions"
  ON reward_redemptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())::uuid AND role = 'parent'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);
