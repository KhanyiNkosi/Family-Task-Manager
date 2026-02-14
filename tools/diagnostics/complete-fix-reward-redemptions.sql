-- COMPLETE FIX for reward_redemptions table
-- This script will DROP and recreate everything from scratch
-- Run this AFTER running the diagnostic script to see what's wrong

-- Step 1: Drop everything cleanly
DROP TABLE IF EXISTS reward_redemptions CASCADE;

-- Step 2: Create the table fresh
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE RLS policies that actually work

-- Policy 1: Anyone can view their own redemptions
CREATE POLICY "Users can view own redemptions"
  ON reward_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Anyone can insert their own redemptions  
CREATE POLICY "Users can create own redemptions"
  ON reward_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Parents can view all family redemptions
CREATE POLICY "Parents view family redemptions"
  ON reward_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.family_id = p2.family_id
      WHERE p1.id = auth.uid() 
      AND p1.role = 'parent'
      AND p2.id = reward_redemptions.user_id
    )
  );

-- Policy 4: Parents can update any family redemptions
CREATE POLICY "Parents update family redemptions"
  ON reward_redemptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.family_id = p2.family_id
      WHERE p1.id = auth.uid() 
      AND p1.role = 'parent'
      AND p2.id = reward_redemptions.user_id
    )
  );

-- Policy 5: Parents can delete family redemptions
CREATE POLICY "Parents delete family redemptions"
  ON reward_redemptions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      JOIN profiles p2 ON p1.family_id = p2.family_id
      WHERE p1.id = auth.uid() 
      AND p1.role = 'parent'
      AND p2.id = reward_redemptions.user_id
    )
  );

-- Step 5: Create indexes for performance
CREATE INDEX idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX idx_reward_redemptions_status ON reward_redemptions(status);
CREATE INDEX idx_reward_redemptions_created_at ON reward_redemptions(created_at DESC);

-- Step 6: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reward_redemptions_updated_at 
  BEFORE UPDATE ON reward_redemptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Grant explicit permissions
GRANT ALL ON reward_redemptions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 8: Verify setup
SELECT 'Table created successfully' as status;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'reward_redemptions';
