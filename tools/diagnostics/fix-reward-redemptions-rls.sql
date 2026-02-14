-- Fix reward_redemptions table and RLS policies
-- This script ensures the table exists and has proper RLS policies for all operations

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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view family reward redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Children can create redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Parents can update redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Parents can delete redemptions" ON reward_redemptions;

-- Create RLS policy for SELECT - Users can view redemptions from their family
CREATE POLICY "Users can view family reward redemptions"
  ON reward_redemptions FOR SELECT
  USING (
    user_id IN (
      SELECT p.id FROM profiles p
      WHERE p.family_id IN (
        SELECT family_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Create RLS policy for INSERT - Any authenticated user can create redemptions for themselves
CREATE POLICY "Users can create their own redemptions"
  ON reward_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy for UPDATE - Parents can update any redemption in their family
CREATE POLICY "Parents can update family redemptions"
  ON reward_redemptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'parent'
      AND family_id IN (
        SELECT family_id FROM profiles WHERE id = reward_redemptions.user_id
      )
    )
  );

-- Create RLS policy for DELETE - Parents can delete redemptions in their family
CREATE POLICY "Parents can delete family redemptions"
  ON reward_redemptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() 
      AND role = 'parent'
      AND family_id IN (
        SELECT family_id FROM profiles WHERE id = reward_redemptions.user_id
      )
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- Grant permissions
GRANT SELECT, INSERT ON reward_redemptions TO authenticated;
GRANT UPDATE, DELETE ON reward_redemptions TO authenticated;
