-- Fix points_required column to allow NULL or have a default
-- Since the app uses points_cost, we can either:
-- Option 1: Make points_required nullable
-- Option 2: Set points_required to default to the same value as points_cost
-- Option 3: Drop points_required if it's not used

-- Let's make points_required nullable for now (safest option)
ALTER TABLE public.rewards ALTER COLUMN points_required DROP NOT NULL;

-- Or if you prefer to keep it NOT NULL with a default:
-- ALTER TABLE public.rewards ALTER COLUMN points_required SET DEFAULT 50;
-- UPDATE public.rewards SET points_required = 50 WHERE points_required IS NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'rewards'
  AND column_name IN ('points_required', 'points_cost')
ORDER BY ordinal_position;
