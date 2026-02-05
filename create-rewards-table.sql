-- Create rewards table for the family task manager
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  family_id TEXT,  -- Temporarily TEXT, will be converted to UUID below
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Create reward redemptions table to track when children redeem rewards
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
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop ALL policies on claimed_rewards table that might reference rewards.family_id
DROP POLICY IF EXISTS "claimed_rewards_insert_user" ON public.claimed_rewards;
DROP POLICY IF EXISTS "claimed_rewards_update_parents" ON public.claimed_rewards;
DROP POLICY IF EXISTS "claimed_rewards_select_family" ON public.claimed_rewards;
DROP POLICY IF EXISTS "claimed_rewards_delete_parents" ON public.claimed_rewards;

-- Drop specific known policies on rewards table
DROP POLICY IF EXISTS "rewards_select_family" ON public.rewards;
DROP POLICY IF EXISTS "rewards_insert_parent" ON public.rewards;
DROP POLICY IF EXISTS "rewards_update_parent" ON public.rewards;
DROP POLICY IF EXISTS "rewards_delete_parent" ON public.rewards;

-- Drop ALL remaining policies on rewards and reward_redemptions tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop all policies on rewards table
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'rewards' AND schemaname = 'public'
  LOOP
    RAISE NOTICE 'Dropping policy % on rewards', pol.policyname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.rewards', pol.policyname);
  END LOOP;
  
  -- Drop all policies on reward_redemptions table
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'reward_redemptions' AND schemaname = 'public'
  LOOP
    RAISE NOTICE 'Dropping policy % on reward_redemptions', pol.policyname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.reward_redemptions', pol.policyname);
  END LOOP;
END $$;

-- Alter the column type to UUID and set NOT NULL
DO $$
BEGIN
  -- Convert family_id from TEXT to UUID if needed
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'family_id' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.rewards ALTER COLUMN family_id TYPE uuid USING family_id::uuid;
  END IF;

  -- Set NOT NULL if not already set
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'family_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- Check for NULL values first
    IF EXISTS (SELECT 1 FROM public.rewards WHERE family_id IS NULL) THEN
      RAISE EXCEPTION 'Cannot set family_id NOT NULL: NULL values exist in public.rewards';
    END IF;
    ALTER TABLE public.rewards ALTER COLUMN family_id SET NOT NULL;
  END IF;
END $$;

-- Policies for rewards table (create fresh after dropping old ones)
CREATE POLICY "Users can view family rewards"
  ON rewards FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = (SELECT auth.uid())::uuid
    )
  );

CREATE POLICY "Parents can create rewards"
  ON rewards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())::uuid AND role = 'parent'
    )
  );

CREATE POLICY "Parents can update rewards"
  ON rewards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())::uuid AND role = 'parent'
    )
  );

CREATE POLICY "Parents can delete rewards"
  ON rewards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())::uuid AND role = 'parent'
    )
  );

-- Policies for reward_redemptions table (create fresh after dropping old ones)
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

CREATE POLICY "Children can create redemptions"
  ON reward_redemptions FOR INSERT
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

CREATE POLICY "Parents can update redemptions"
  ON reward_redemptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())::uuid AND role = 'parent'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_by ON rewards(created_by);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- Create trigger to automatically update updated_at for rewards
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_rewards_updated_at();
