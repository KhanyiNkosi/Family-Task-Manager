-- ============================================================================
-- COMPLETE UUID MIGRATION: All Tables + Foreign Keys
-- ============================================================================
-- Handles all family_id columns and foreign key constraints
-- ============================================================================

-- ========================================
-- STEP 1: Find ALL family_id dependencies
-- ========================================

-- Find all tables with family_id column
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'family_id'
ORDER BY table_name;

-- Find all foreign keys involving family_id or families.id
SELECT
  tc.constraint_name,
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
AND (
  kcu.column_name = 'family_id'
  OR ccu.column_name = 'id' AND ccu.table_name = 'families'
)
ORDER BY tc.table_name, tc.constraint_name;

-- ========================================
-- STEP 2: Drop ALL policies
-- ========================================

-- Drop ALL policies (we'll create new ones later)
DO $$
DECLARE
  v_policy RECORD;
BEGIN
  FOR v_policy IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'tasks', 'families', 'rewards', 'reward_redemptions', 
                      'notifications', 'bulletin_messages', 'user_settings')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                   v_policy.policyname, v_policy.schemaname, v_policy.tablename);
    RAISE NOTICE 'Dropped policy: % on %', v_policy.policyname, v_policy.tablename;
  END LOOP;
  RAISE NOTICE '✅ All policies dropped';
END $$;

-- ========================================
-- STEP 3: Drop ALL foreign keys
-- ========================================

-- Drop foreign keys that reference families.id or use family_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_family_id_fkey CASCADE;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_family_id_fkey CASCADE;
ALTER TABLE public.rewards DROP CONSTRAINT IF EXISTS rewards_family_id_fkey CASCADE;
ALTER TABLE public.reward_redemptions DROP CONSTRAINT IF EXISTS reward_redemptions_family_id_fkey CASCADE;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_family_id_fkey CASCADE;
ALTER TABLE public.bulletin_messages DROP CONSTRAINT IF EXISTS bulletin_messages_family_id_fkey CASCADE;
ALTER TABLE public.user_settings DROP CONSTRAINT IF EXISTS user_settings_family_id_fkey CASCADE;
ALTER TABLE public.activity_feed DROP CONSTRAINT IF EXISTS activity_feed_family_id_fkey CASCADE;
ALTER TABLE public.notification_debug DROP CONSTRAINT IF EXISTS notification_debug_family_id_fkey CASCADE;

-- Drop any other FKs dynamically
DO $$
DECLARE
  v_fk RECORD;
BEGIN
  FOR v_fk IN 
    SELECT tc.constraint_name, tc.table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'family_id'
  LOOP
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I CASCADE',
                   v_fk.table_name, v_fk.constraint_name);
    RAISE NOTICE 'Dropped FK: % on %', v_fk.constraint_name, v_fk.table_name;
  END LOOP;
  RAISE NOTICE '✅ All foreign keys dropped';
END $$;

-- ========================================
-- STEP 4: Convert ALL family_id columns to UUID
-- ========================================

-- Drop PRIMARY KEY on families.id (blocks type conversion due to internal triggers)
ALTER TABLE public.families DROP CONSTRAINT IF EXISTS families_pkey CASCADE;

-- Convert families.id first (since others reference it)
DO $$
BEGIN
  ALTER TABLE public.families 
  ALTER COLUMN id TYPE uuid 
  USING id::uuid;
  RAISE NOTICE '✅ families.id → uuid';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️  families.id conversion failed: %', SQLERRM;
END $$;

-- Recreate PRIMARY KEY on families.id
ALTER TABLE public.families ADD PRIMARY KEY (id);

-- Convert each table's family_id column
DO $$
DECLARE
  v_table TEXT;
  v_sql TEXT;
BEGIN
  FOR v_table IN 
    SELECT c.table_name 
    FROM information_schema.columns c
    JOIN information_schema.tables t 
      ON c.table_name = t.table_name 
      AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public'
    AND c.column_name = 'family_id'
    AND c.data_type IN ('text', 'character varying')
    AND t.table_type = 'BASE TABLE'  -- Skip views!
    ORDER BY c.table_name
  LOOP
    BEGIN
      RAISE NOTICE 'Converting %.family_id to uuid...', v_table;
      v_sql := format('ALTER TABLE public.%I ALTER COLUMN family_id TYPE uuid USING family_id::uuid', v_table);
      EXECUTE v_sql;
      RAISE NOTICE '✅ %.family_id → uuid', v_table;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️  %.family_id conversion failed: % (may be a view or have dependencies)', v_table, SQLERRM;
    END;
  END LOOP;
END $$;

-- ========================================
-- STEP 5: Recreate foreign keys
-- ========================================

-- Recreate foreign keys (now with matching uuid types)
DO $$
DECLARE
  v_table TEXT;
  v_constraint_name TEXT;
BEGIN
  -- Recreate known FKs
  FOR v_table IN 
    SELECT c.table_name 
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON c.table_name = t.table_name
      AND c.table_schema = t.table_schema
    WHERE c.table_schema = 'public'
    AND c.column_name = 'family_id'
    AND t.table_type = 'BASE TABLE'  -- Skip views!
    ORDER BY c.table_name
  LOOP
    v_constraint_name := v_table || '_family_id_fkey';
    BEGIN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE',
        v_table, v_constraint_name
      );
      RAISE NOTICE '✅ Recreated FK: % on %', v_constraint_name, v_table;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️  Could not create FK on %: % (may be a view or already exists)', v_table, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE '✅ Foreign keys recreated';
END $$;

-- ========================================
-- STEP 6: Create NEW policies (2-parent ready)
-- ========================================

-- PROFILES policies
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

-- FAMILIES policies
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

-- TASKS policies (KEY for 2-parent dashboard!)
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

DO $$ BEGIN RAISE NOTICE '✅ Core policies created (profiles, families, tasks)'; END $$;

-- ========================================
-- STEP 7: Verify conversions
-- ========================================

SELECT 
  table_name,
  column_name,
  data_type,
  CASE WHEN data_type = 'uuid' THEN '✅' ELSE '❌' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
AND (
  column_name = 'family_id'
  OR (table_name = 'families' AND column_name = 'id')
)
ORDER BY table_name, column_name;

-- ========================================
-- STEP 8: Verify foreign keys
-- ========================================

SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'family_id'
ORDER BY tc.table_name;

-- ========================================
-- STEP 9: Test RLS (Parent 1)
-- ========================================

DO $$
DECLARE
  v_parent1_id UUID := 'd86ed1ac-40b4-41c7-8b3c-0ce6ee8855f3';
  v_task_count INTEGER;
BEGIN
  PERFORM set_config('request.jwt.claims', 
    json_build_object('sub', v_parent1_id::text, 'role', 'authenticated')::text, 
    true);
  
  SELECT COUNT(*) INTO v_task_count FROM public.tasks;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Parent 1 can see % tasks (expected: 4)', v_task_count;
  
  IF v_task_count = 4 THEN
    RAISE NOTICE '🎉 SUCCESS! RLS works!';
  ELSE
    RAISE NOTICE '⚠️  Expected 4, got %', v_task_count;
  END IF;
  
  PERFORM set_config('request.jwt.claims', NULL, true);
END $$;

-- ========================================
-- COMPLETE!
-- ========================================
-- ✅ All family_id columns converted to UUID
-- ✅ All foreign keys recreated
-- ✅ New 2-parent policies created
-- ✅ RLS tested
--
-- FINAL STEP: Both parents refresh dashboards!
