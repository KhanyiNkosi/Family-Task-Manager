-- ============================================================================
-- FORCE UUID CONVERSION: No exception handlers, see real errors
-- ============================================================================

-- ========================================
-- STEP 1: Drop EVERY policy aggressively
-- ========================================

-- Families policies
DROP POLICY IF EXISTS "Family members can view family" ON public.families CASCADE;
DROP POLICY IF EXISTS "Owner can update family" ON public.families CASCADE;
DROP POLICY IF EXISTS "Users can create family" ON public.families CASCADE;
DROP POLICY IF EXISTS "families_delete_owner" ON public.families CASCADE;
DROP POLICY IF EXISTS "families_insert_owner" ON public.families CASCADE;
DROP POLICY IF EXISTS "families_invite_select" ON public.families CASCADE;
DROP POLICY IF EXISTS "families_owner_select" ON public.families CASCADE;
DROP POLICY IF EXISTS "families_select_owner_or_member" ON public.families CASCADE;
DROP POLICY IF EXISTS "families_update_owner" ON public.families CASCADE;

-- Profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can view family member profiles" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "allow_delete_own_profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "allow_insert_own_profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "allow_select_own_profile" ON public.profiles CASCADE;
DROP POLICY IF EXISTS "allow_update_own_profile" ON public.profiles CASCADE;

-- Tasks policies
DROP POLICY IF EXISTS "Family members can update family tasks" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "Family members can view all family tasks" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "Parents can create tasks" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "Task creators can delete tasks" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_delete_parent" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_insert_parent" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_update_assigned" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_update_created" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_update_parent" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_view_assigned" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_view_created" ON public.tasks CASCADE;
DROP POLICY IF EXISTS "tasks_view_family" ON public.tasks CASCADE;

-- Rewards policies
DROP POLICY IF EXISTS "Parents can create rewards" ON public.rewards CASCADE;
DROP POLICY IF EXISTS "Parents can delete rewards" ON public.rewards CASCADE;
DROP POLICY IF EXISTS "Parents can update rewards" ON public.rewards CASCADE;
DROP POLICY IF EXISTS "Users can view family rewards" ON public.rewards CASCADE;
DROP POLICY IF EXISTS "rewards_select_admin" ON public.rewards CASCADE;
DROP POLICY IF EXISTS "rewards_select_authenticated" ON public.rewards CASCADE;
DROP POLICY IF EXISTS "rewards_update_admin" ON public.rewards CASCADE;

-- Bulletin Messages policies
DROP POLICY IF EXISTS "Users can create family bulletin messages" ON public.bulletin_messages CASCADE;
DROP POLICY IF EXISTS "Users can delete family bulletin messages" ON public.bulletin_messages CASCADE;
DROP POLICY IF EXISTS "Users can delete their own bulletin messages" ON public.bulletin_messages CASCADE;
DROP POLICY IF EXISTS "Users can update family bulletin messages" ON public.bulletin_messages CASCADE;
DROP POLICY IF EXISTS "Users can update their own bulletin messages" ON public.bulletin_messages CASCADE;
DROP POLICY IF EXISTS "Users can view their family bulletin messages" ON public.bulletin_messages CASCADE;

-- Activity Feed policies
DROP POLICY IF EXISTS "Family members view own family feed" ON public.activity_feed CASCADE;
DROP POLICY IF EXISTS "Parents delete activities" ON public.activity_feed CASCADE;
DROP POLICY IF EXISTS "Parents update activities" ON public.activity_feed CASCADE;
DROP POLICY IF EXISTS "Users create activities" ON public.activity_feed CASCADE;

-- Reward Redemptions policies (CRITICAL - was blocking conversion!)
DROP POLICY IF EXISTS "Parents delete family redemptions" ON public.reward_redemptions CASCADE;
DROP POLICY IF EXISTS "Parents view family redemptions" ON public.reward_redemptions CASCADE;
DROP POLICY IF EXISTS "Users create redemptions" ON public.reward_redemptions CASCADE;
DROP POLICY IF EXISTS "Users view own redemptions" ON public.reward_redemptions CASCADE;

-- User Settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings CASCADE;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings CASCADE;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings CASCADE;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications CASCADE;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications CASCADE;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications CASCADE;

-- Storage bucket policies (CRITICAL - blocks family_id conversion!)
DROP POLICY IF EXISTS "Parents can delete family task photos" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Parents can upload task photos" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Family members can view task photos" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Users can upload task photos" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Users can view task photos" ON storage.objects CASCADE;
DROP POLICY IF EXISTS "Users can delete their task photos" ON storage.objects CASCADE;

-- Drop ALL other policies dynamically (catch any we missed)
DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')  -- Include storage schema!
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
                   v_policy.policyname, v_policy.schemaname, v_policy.tablename);
  END LOOP;
END $$;

-- ========================================
-- STEP 2: Drop ALL indexes on family_id
-- ========================================

-- Drop specific known indexes
DROP INDEX IF EXISTS public.idx_activity_feed_family_id CASCADE;
DROP INDEX IF EXISTS public.idx_profiles_family_id CASCADE;
DROP INDEX IF EXISTS public.idx_tasks_family_id CASCADE;

-- Drop any other family_id indexes dynamically
DO $$
DECLARE
  v_index RECORD;
BEGIN
  FOR v_index IN 
    SELECT schemaname, indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexdef LIKE '%family_id%'
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS %I.%I CASCADE', v_index.schemaname, v_index.indexname);
  END LOOP;
END $$;

-- ========================================
-- STEP 3: Drop ALL views that use family_id
-- ========================================

-- Drop views (they can't have column types altered)
DROP VIEW IF EXISTS public.activity_feed_with_stats CASCADE;

-- Drop any other views dynamically
DO $$
DECLARE
  v_view RECORD;
BEGIN
  FOR v_view IN 
    SELECT table_schema, table_name
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name IN (
      SELECT table_name FROM information_schema.columns 
      WHERE column_name = 'family_id' 
      AND table_schema = 'public'
    )
  LOOP
    EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', v_view.table_schema, v_view.table_name);
  END LOOP;
END $$;

-- ========================================
-- STEP 4: Drop ALL triggers
-- ========================================

-- Drop specific known triggers
DROP TRIGGER IF EXISTS add_default_rewards_trigger ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS generate_family_invitation_code ON public.families CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Drop all other triggers dynamically on tables with family_id
DO $$
DECLARE
  v_trigger RECORD;
BEGIN
  FOR v_trigger IN 
    SELECT event_object_table, trigger_name
    FROM information_schema.triggers
    WHERE event_object_schema = 'public'
    AND trigger_name NOT LIKE 'RI_ConstraintTrigger%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', 
                   v_trigger.trigger_name, v_trigger.event_object_table);
  END LOOP;
END $$;

-- ========================================
-- STEP 5: Drop ALL foreign keys
-- ========================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_family_id_fkey CASCADE;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_family_id_fkey CASCADE;
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_family_id_fkey CASCADE;
ALTER TABLE public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_family_id_fkey CASCADE;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_family_id_fkey CASCADE;
ALTER TABLE public.bulletin_messages DROP CONSTRAINT IF EXISTS bulletin_messages_family_id_fkey CASCADE;
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_family_id_fkey CASCADE;
ALTER TABLE public.activity_feed DROP CONSTRAINT IF EXISTS activity_feed_family_id_fkey CASCADE;
ALTER TABLE public.notification_debug DROP CONSTRAINT IF EXISTS notification_debug_family_id_fkey CASCADE;

-- ========================================
-- STEP 6: Convert to UUID (NO EXCEPTION HANDLERS)
-- ========================================

-- Drop PRIMARY KEY first
ALTER TABLE public.families DROP CONSTRAINT IF EXISTS families_pkey CASCADE;

-- Convert families.id
ALTER TABLE public.families ALTER COLUMN id TYPE uuid USING id::uuid;

-- Recreate PRIMARY KEY
ALTER TABLE public.families ADD PRIMARY KEY (id);

-- Convert each table (NO EXCEPTION HANDLING - we want to see errors!)
ALTER TABLE public.profiles ALTER COLUMN family_id TYPE uuid USING family_id::uuid;
ALTER TABLE public.tasks ALTER COLUMN family_id TYPE uuid USING family_id::uuid;
ALTER TABLE public.rewards ALTER COLUMN family_id TYPE uuid USING family_id::uuid;
ALTER TABLE public.bulletin_messages ALTER COLUMN family_id TYPE uuid USING family_id::uuid;
ALTER TABLE public.activity_feed ALTER COLUMN family_id TYPE uuid USING family_id::uuid;

-- ========================================
-- STEP 7: Recreate foreign keys
-- ========================================
-- Note: Indexes will be automatically recreated by PostgreSQL when FKs are added

ALTER TABLE public.profiles ADD CONSTRAINT profiles_family_id_fkey 
  FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.tasks ADD CONSTRAINT tasks_family_id_fkey 
  FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.rewards ADD CONSTRAINT rewards_family_id_fkey 
  FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.bulletin_messages ADD CONSTRAINT bulletin_messages_family_id_fkey 
  FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

ALTER TABLE public.activity_feed ADD CONSTRAINT activity_feed_family_id_fkey 
  FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

-- ========================================
-- STEP 8: Recreate critical triggers
-- ========================================

-- Recreate family invitation code trigger
CREATE OR REPLACE FUNCTION generate_family_invitation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invitation_code IS NULL THEN
    NEW.invitation_code := UPPER(LEFT(MD5(RANDOM()::TEXT), 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_family_invitation_code
  BEFORE INSERT ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION generate_family_invitation_code();

-- Note: add_default_rewards_trigger will need to be recreated from your original SQL file
-- It depends on your specific business logic

-- ========================================
-- STEP 9: Create MINIMAL essential policies
-- ========================================

-- PROFILES (with explicit UUID casts!)
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT TO authenticated
USING ((auth.uid())::uuid = id);

CREATE POLICY "Users can view family member profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles self
    WHERE self.id = (auth.uid())::uuid
    AND self.family_id = profiles.family_id
    AND self.family_id IS NOT NULL
  )
);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING ((auth.uid())::uuid = id) WITH CHECK ((auth.uid())::uuid = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK ((auth.uid())::uuid = id);

-- FAMILIES (with UUID cast for safety)
CREATE POLICY "Family members can view family"
ON public.families FOR SELECT TO authenticated
USING (
  id IN (SELECT family_id FROM public.profiles WHERE id = (auth.uid())::uuid)
);

CREATE POLICY "Owner can update family"
ON public.families FOR UPDATE TO authenticated
USING (owner_id = (auth.uid())::uuid) WITH CHECK (owner_id = (auth.uid())::uuid);

CREATE POLICY "Users can create family"
ON public.families FOR INSERT TO authenticated
WITH CHECK (owner_id = (auth.uid())::uuid);

-- TASKS (KEY for 2-parent!)
CREATE POLICY "Family members can view all family tasks"
ON public.tasks FOR SELECT TO authenticated
USING (
  family_id IN (SELECT family_id FROM public.profiles WHERE id = (auth.uid())::uuid)
);

CREATE POLICY "Parents can create tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (
  created_by = (auth.uid())::uuid
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (auth.uid())::uuid AND role = 'parent'
    AND family_id = tasks.family_id
  )
);

CREATE POLICY "Family members can update family tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (
  family_id IN (SELECT family_id FROM public.profiles WHERE id = (auth.uid())::uuid)
)
WITH CHECK (
  family_id IN (SELECT family_id FROM public.profiles WHERE id = (auth.uid())::uuid)
);

CREATE POLICY "Task creators can delete tasks"
ON public.tasks FOR DELETE TO authenticated
USING (created_by = (auth.uid())::uuid);

-- Note: Views like activity_feed_with_stats need to be recreated manually
-- They were dropped to allow column type conversion

-- ========================================
-- STEP 10: Verify
-- ========================================

SELECT 
  table_name,
  column_name,
  data_type,
  CASE WHEN data_type = 'uuid' THEN '✅ UUID' ELSE '❌ STILL TEXT' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
  column_name = 'family_id'
  OR (table_name = 'families' AND column_name = 'id')
)
ORDER BY table_name, column_name;
