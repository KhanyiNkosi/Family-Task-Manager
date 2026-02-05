-- Comprehensive rewards table migration
-- This script:
-- 1. Drops all existing policies on rewards, reward_redemptions, claimed_rewards
-- 2. Adds missing columns to rewards table
-- 3. Converts family_id from TEXT to UUID
-- 4. Creates fresh RLS policies with proper UUID types
-- 5. Creates indexes and triggers

-- Step 1: Drop ALL existing policies on affected tables
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
  
  -- Drop all policies on claimed_rewards table (to prevent blocking dependencies)
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'claimed_rewards' AND schemaname = 'public'
  LOOP
    RAISE NOTICE 'Dropping policy % on claimed_rewards', pol.policyname;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.claimed_rewards', pol.policyname);
  END LOOP;
END $$;

-- Step 2: Create tables if they don't exist
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  family_id TEXT,  -- Will be converted to UUID below
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

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

-- Step 3: Add missing columns to rewards table if they don't exist
DO $$
BEGIN
  -- Add created_by column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added created_by column to rewards';
  END IF;
  
  -- Ensure is_active exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column to rewards';
  END IF;
  
  -- Ensure updated_at exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to rewards';
  END IF;
END $$;

-- Step 4: Convert family_id from TEXT to UUID
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
    RAISE NOTICE 'Converting family_id from TEXT to UUID';
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
    RAISE NOTICE 'Set family_id to NOT NULL';
  END IF;
END $$;

-- Step 5: Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Step 6: Create fresh RLS policies for rewards table
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
    AND family_id IN (
      SELECT family_id FROM profiles WHERE id = (SELECT auth.uid())::uuid
    )
  );

CREATE POLICY "Parents can update rewards"
  ON rewards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())::uuid AND role = 'parent'
    )
    AND family_id IN (
      SELECT family_id FROM profiles WHERE id = (SELECT auth.uid())::uuid
    )
  );

CREATE POLICY "Parents can delete rewards"
  ON rewards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (SELECT auth.uid())::uuid AND role = 'parent'
    )
    AND family_id IN (
      SELECT family_id FROM profiles WHERE id = (SELECT auth.uid())::uuid
    )
  );

-- Step 7: Create fresh RLS policies for reward_redemptions table
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

-- Step 8: Recreate claimed_rewards policies (restore original functionality)
CREATE POLICY "claimed_rewards_select_owner"
  ON claimed_rewards FOR SELECT
  USING ((SELECT auth.uid())::uuid = user_id);

CREATE POLICY "claimed_rewards_insert_owner"
  ON claimed_rewards FOR INSERT
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

CREATE POLICY "claimed_rewards_update_owner"
  ON claimed_rewards FOR UPDATE
  USING ((SELECT auth.uid())::uuid = user_id)
  WITH CHECK ((SELECT auth.uid())::uuid = user_id);

CREATE POLICY "claimed_rewards_delete_owner"
  ON claimed_rewards FOR DELETE
  USING ((SELECT auth.uid())::uuid = user_id);

-- Step 9: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_rewards_created_by ON rewards(created_by);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user_id ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);

-- Step 10: Create trigger to automatically update updated_at for rewards
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rewards_updated_at ON rewards;
CREATE TRIGGER rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_rewards_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Rewards table migration completed successfully!';
  RAISE NOTICE 'family_id is now UUID type';
  RAISE NOTICE 'All RLS policies recreated with proper UUID casting';
END $$;
