-- Add missing columns to rewards table

-- Add points_cost column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'points_cost'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN points_cost INTEGER NOT NULL DEFAULT 50 CHECK (points_cost > 0);
    RAISE NOTICE 'Added points_cost column to rewards';
  END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to rewards';
  END IF;
END $$;

-- Add created_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added created_by column to rewards';
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'rewards' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.rewards ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column to rewards';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_rewards_created_by ON rewards(created_by);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON rewards(is_active);

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS rewards_updated_at ON rewards;
CREATE TRIGGER rewards_updated_atre
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_rewards_updated_at();

-- Verify the columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'rewards'
ORDER BY ordinal_position;
