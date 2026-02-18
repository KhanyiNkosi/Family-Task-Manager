-- ============================================================================
-- Recreate foreign keys with correct column names
-- ============================================================================

-- Tasks table foreign keys
ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

ALTER TABLE public.tasks 
DROP CONSTRAINT IF EXISTS tasks_family_id_fkey;

ALTER TABLE public.tasks 
ADD CONSTRAINT tasks_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

-- Rewards table
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
ON DELETE SET NULL;

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

SELECT '✅ All foreign keys recreated - refresh app now!' as status;
