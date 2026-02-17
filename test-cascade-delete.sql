-- TEST: Verify CASCADE deletion works

-- STEP 1: Create a test family
INSERT INTO public.families (id, name, invitation_code)
VALUES ('00000000-0000-0000-0000-000000000001', 'TEST_FAMILY_DELETE_ME', 'TESTCODE')
RETURNING *;

-- STEP 2: Create test rewards for this family
INSERT INTO public.rewards (family_id, name, points_required, icon)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Test Reward 1', 100, '🎁'),
    ('00000000-0000-0000-0000-000000000001', 'Test Reward 2', 200, '🎮')
RETURNING *;

-- STEP 3: Verify rewards exist
SELECT id, name, family_id FROM public.rewards 
WHERE family_id = '00000000-0000-0000-0000-000000000001';

-- STEP 4: Delete the test family (should CASCADE delete rewards)
DELETE FROM public.families 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- STEP 5: Verify rewards were automatically deleted
SELECT id, name, family_id FROM public.rewards 
WHERE family_id = '00000000-0000-0000-0000-000000000001';
-- Should return 0 rows if CASCADE worked

-- CLEANUP: If family wasn't deleted, run this:
-- DELETE FROM public.rewards WHERE family_id = '00000000-0000-0000-0000-000000000001';
-- DELETE FROM public.families WHERE id = '00000000-0000-0000-0000-000000000001';
