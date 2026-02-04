-- Re-enable RLS with simplified policies that won't cause 500 errors

-- First, drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, efficient policies

-- Policy 1: Users can view their own profile (no joins, no subqueries)
CREATE POLICY "view_own_profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Users can view profiles with same family_id
CREATE POLICY "view_family_profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (
    family_id IN (
      SELECT family_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
      AND family_id IS NOT NULL
    )
  );

-- Policy 3: Users can update their own profile
CREATE POLICY "update_own_profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);
