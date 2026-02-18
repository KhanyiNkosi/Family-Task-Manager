-- ============================================================================
-- DIAGNOSTIC: Check what's blocking family access
-- ============================================================================

-- Check current user's profile (should show family_id)
SELECT 
  id,
  email,
  role,
  family_id,
  'Current user profile' as note
FROM public.profiles 
WHERE id = auth.uid();

-- Check if family exists with that family_id
SELECT 
  f.id,
  f.name,
  f.owner_id,
  'Family data' as note
FROM public.families f
WHERE f.id = (SELECT family_id FROM public.profiles WHERE id = auth.uid());

-- Check tasks for that family
SELECT 
  t.id,
  t.title,
  t.family_id,
  'Tasks' as note
FROM public.tasks t
WHERE t.family_id = (SELECT family_id FROM public.profiles WHERE id = auth.uid());

-- Test the families_select policy logic manually
SELECT 
  f.id,
  f.name,
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.family_id = f.id
  ) as "policy_would_allow"
FROM public.families f;
