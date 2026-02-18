-- ============================================================================
-- Recreate missing foreign keys dropped during UUID migration
-- ============================================================================

-- Check what FKs currently exist on tasks table
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  '📋 Existing FK' as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'tasks';

-- Recreate tasks foreign keys
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Check other tables that might be missing FKs
-- Rewards
ALTER TABLE public.rewards 
DROP CONSTRAINT IF EXISTS rewards_family_id_fkey;

ALTER TABLE public.rewards 
ADD CONSTRAINT rewards_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

-- Bulletin messages
ALTER TABLE public.bulletin_messages 
DROP CONSTRAINT IF EXISTS bulletin_messages_family_id_fkey;

ALTER TABLE public.bulletin_messages 
ADD CONSTRAINT bulletin_messages_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

ALTER TABLE public.bulletin_messages 
DROP CONSTRAINT IF EXISTS bulletin_messages_created_by_fkey;

ALTER TABLE public.bulletin_messages 
ADD CONSTRAINT bulletin_messages_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Notifications
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_family_id_fkey;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

-- Activity feed
ALTER TABLE public.activity_feed 
DROP CONSTRAINT IF EXISTS activity_feed_family_id_fkey;

ALTER TABLE public.activity_feed 
ADD CONSTRAINT activity_feed_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

SELECT '✅ Foreign keys recreated - refresh app to test' as status;
