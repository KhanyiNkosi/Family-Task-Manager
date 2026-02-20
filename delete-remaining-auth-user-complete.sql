-- COMPLETE AUTH USER DELETION
-- This deletes ALL remaining references to the test accounts

-- Replace these user IDs with the actual remaining user ID(s)
-- Run diagnose-remaining-auth-user.sql first to confirm which user(s) remain

-- User IDs:
-- d86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3 (kometsinkanyezi@gmail.com)
-- d8d0524f-fe0c-40ed-912b-9f1c17e8b5a3 (nkazimulokometsi@gmail.com)
-- 5bdc3661-63e7-4fd9-ae08-d6acfb1322b0 (lwandlekometsi3132@gmail.com)

-- Family ID:
-- a81f29d9-498b-48f8-a164-e933cab30316

BEGIN;

-- 1. Delete from auth schema tables first (these might be blocking)
DELETE FROM auth.sessions 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM auth.identities 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM auth.refresh_tokens
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

-- 2. Delete tasks by family_id (these tables don't have created_by/assigned_to columns)
DELETE FROM tasks 
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316';

-- 3. Delete rewards by family_id
DELETE FROM rewards 
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316';

-- 4. Delete bulletin_messages by family_id
DELETE FROM bulletin_messages 
WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316';

-- 5. Delete any remaining user data (redundant but safe)
DELETE FROM reward_redemptions 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM activity_comments 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM activity_reactions 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM activity_feed 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM user_achievements 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM user_streaks 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM user_levels 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM notifications 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

DELETE FROM user_settings 
WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

-- 6. Delete families again (in case any remain)
DELETE FROM families 
WHERE id = 'a81f29d9-498b-48f8-a164-e933cab30316';

-- 7. Delete profiles again (in case any remain)
DELETE FROM profiles 
WHERE id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

-- 8. Finally, delete from auth.users
DELETE FROM auth.users 
WHERE id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);

COMMIT;

-- 9. Verify all deleted
SELECT 'Auth Users' as type, COUNT(*) as remaining 
FROM auth.users WHERE email LIKE '%kometsi%'
UNION ALL
SELECT 'Profiles', COUNT(*) 
FROM profiles WHERE id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)
UNION ALL
SELECT 'Families', COUNT(*) 
FROM families WHERE id = 'a81f29d9-498b-48f8-a164-e933cab30316'
UNION ALL
SELECT 'Tasks', COUNT(*) 
FROM tasks WHERE family_id = 'a81f29d9-498b-48f8-a164-e933cab30316'
UNION ALL
SELECT 'Auth Sessions', COUNT(*) 
FROM auth.sessions WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
)
UNION ALL
SELECT 'Auth Identities', COUNT(*) 
FROM auth.identities WHERE user_id IN (
  'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3',
  'd8d0524f-fe0c-40ed-912b-9f1c17e8b5a3',
  '5bdc3661-63e7-4fd9-ae08-d6acfb1322b0'
);
