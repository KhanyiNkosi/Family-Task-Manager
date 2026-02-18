-- ============================================================================
-- Add foreign keys ONLY for columns that exist
-- ============================================================================

-- TASKS table (has: assigned_to, created_by, family_id)
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

-- REWARDS table (has: created_by, family_id)
ALTER TABLE public.rewards 
DROP CONSTRAINT IF EXISTS rewards_created_by_fkey;

ALTER TABLE public.rewards 
ADD CONSTRAINT rewards_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

ALTER TABLE public.rewards 
DROP CONSTRAINT IF EXISTS rewards_family_id_fkey;

ALTER TABLE public.rewards 
ADD CONSTRAINT rewards_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

-- BULLETIN_MESSAGES table (has: family_id only)
ALTER TABLE public.bulletin_messages 
DROP CONSTRAINT IF EXISTS bulletin_messages_family_id_fkey;

ALTER TABLE public.bulletin_messages 
ADD CONSTRAINT bulletin_messages_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

-- NOTIFICATIONS table (has: family_id only)
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_family_id_fkey;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

-- ACTIVITY_FEED table (has: family_id only)
ALTER TABLE public.activity_feed 
DROP CONSTRAINT IF EXISTS activity_feed_family_id_fkey;

ALTER TABLE public.activity_feed 
ADD CONSTRAINT activity_feed_family_id_fkey 
FOREIGN KEY (family_id) 
REFERENCES public.families(id) 
ON DELETE CASCADE;

SELECT '✅ All foreign keys created successfully! Refresh your app now.' as status;
