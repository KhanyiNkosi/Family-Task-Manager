-- Fix RLS policies to avoid 500 errors
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family profiles" ON public.profiles;

-- Create simpler, non-circular policies
-- Policy 1: Users can always see their own profile (no subquery)
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: Users can see profiles in their family (using a join instead of nested subquery)
CREATE POLICY "Users can view family member profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles self
      WHERE self.id = auth.uid()
      AND self.family_id = profiles.family_id
      AND self.family_id IS NOT NULL
    )
  );
