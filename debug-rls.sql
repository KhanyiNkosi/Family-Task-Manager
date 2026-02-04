-- Debug RLS issues by checking what's happening

-- Step 1: Check if the profile exists
SELECT id, email, family_id, created_at 
FROM public.profiles 
WHERE id = '081a3483-9e2b-43e6-bf89-302fac88b186';

-- Step 2: Check auth context
SELECT auth.uid();

-- Step 3: Try disabling RLS temporarily to see if it's the issue
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- After running the above, try accessing the dashboard again
-- If it works, the issue is with RLS policies
-- Then re-enable with:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
