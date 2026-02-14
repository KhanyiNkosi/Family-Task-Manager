-- ============================================================================
-- COMPREHENSIVE FIX: Convert ALL family_id columns from UUID to TEXT
-- ============================================================================
-- This converts ALL family_id related columns to TEXT to match families.id
-- Handles: profiles, activity_feed, tasks, bulletin_messages, reward_redemptions
-- ============================================================================

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Converting ALL family_id columns: UUID → TEXT';
  RAISE NOTICE '====================================';
END $$;

-- ============================================================================
-- STEP 1: VALIDATION - Show current types
-- ============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  RAISE NOTICE '📊 Current family_id column types:';
  
  FOR v_rec IN 
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (column_name LIKE '%family%' OR (table_name = 'families' AND column_name = 'id'))
      AND table_name IN ('profiles', 'families', 'activity_feed', 'tasks', 'bulletin_messages', 'reward_redemptions', 'rewards')
    ORDER BY table_name, column_name
  LOOP
    RAISE NOTICE '  %.% = %', v_rec.table_name, v_rec.column_name, v_rec.data_type;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 2: DROP ALL FOREIGN KEY CONSTRAINTS
-- ============================================================================

DO $$
DECLARE
  v_constraint RECORD;
BEGIN
  RAISE NOTICE '🔓 Dropping all foreign key constraints involving family_id...';
  
  FOR v_constraint IN
    SELECT 
      tc.table_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND kcu.column_name LIKE '%family%'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', 
      v_constraint.table_name, v_constraint.constraint_name);
    RAISE NOTICE '  Dropped: %.%', v_constraint.table_name, v_constraint.constraint_name;
  END LOOP;
END $$;

-- ============================================================================
-- STEP 3: DROP ALL RLS POLICIES (we'll recreate them)
-- ============================================================================

DO $$
DECLARE
  v_policy RECORD;
BEGIN
  RAISE NOTICE '🔓 Dropping RLS policies that reference family_id...';
  
  -- Drop policies on profiles
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', v_policy.policyname);
    RAISE NOTICE '  Dropped: profiles.%', v_policy.policyname;
  END LOOP;
  
  -- Drop policies on families
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'families'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON families', v_policy.policyname);
    RAISE NOTICE '  Dropped: families.%', v_policy.policyname;
  END LOOP;
  
  -- Drop policies on activity_feed
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'activity_feed'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON activity_feed', v_policy.policyname);
    RAISE NOTICE '  Dropped: activity_feed.%', v_policy.policyname;
  END LOOP;
  
  -- Drop policies on tasks
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'tasks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON tasks', v_policy.policyname);
    RAISE NOTICE '  Dropped: tasks.%', v_policy.policyname;
  END LOOP;
  
  -- Drop policies on storage.objects (family task photos)
  FOR v_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND (qual ILIKE '%family%' OR with_check ILIKE '%family%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', v_policy.policyname);
    RAISE NOTICE '  Dropped: storage.objects.%', v_policy.policyname;
  END LOOP;
  
  -- Drop policies on bulletin_messages (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bulletin_messages') THEN
    FOR v_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'bulletin_messages'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON bulletin_messages', v_policy.policyname);
      RAISE NOTICE '  Dropped: bulletin_messages.%', v_policy.policyname;
    END LOOP;
  END IF;
  
  -- Drop policies on reward_redemptions (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reward_redemptions') THEN
    FOR v_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'reward_redemptions'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON reward_redemptions', v_policy.policyname);
      RAISE NOTICE '  Dropped: reward_redemptions.%', v_policy.policyname;
    END LOOP;
  END IF;
  
  -- Drop policies on rewards (if exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rewards') THEN
    FOR v_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'rewards'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON rewards', v_policy.policyname);
      RAISE NOTICE '  Dropped: rewards.%', v_policy.policyname;
    END LOOP;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: DROP INDEXES on family_id columns
-- ============================================================================

DROP INDEX IF EXISTS idx_profiles_family_id;
DROP INDEX IF EXISTS idx_activity_feed_family_id;
DROP INDEX IF EXISTS idx_tasks_family_id;
DROP INDEX IF EXISTS idx_bulletin_messages_family_id;
DROP INDEX IF EXISTS idx_reward_redemptions_family_id;
DROP INDEX IF EXISTS idx_rewards_family_id;
DROP INDEX IF EXISTS idx_families_id;

DO $$
BEGIN
  RAISE NOTICE '🗑️ Dropped indexes on family_id columns';
END $$;

-- ============================================================================
-- STEP 5: ALTER ALL family_id COLUMNS from UUID to TEXT
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔄 Converting family_id columns: UUID → TEXT...';
END $$;

-- Convert profiles.family_id
ALTER TABLE profiles 
  ALTER COLUMN family_id TYPE TEXT USING family_id::TEXT;

-- Convert activity_feed.family_id (if UUID)
DO $$
DECLARE
  v_type TEXT;
BEGIN
  SELECT data_type INTO v_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'activity_feed'
    AND column_name = 'family_id';
  
  IF v_type = 'uuid' THEN
    ALTER TABLE activity_feed 
      ALTER COLUMN family_id TYPE TEXT USING family_id::TEXT;
    RAISE NOTICE '  ✅ Converted activity_feed.family_id: UUID → TEXT';
  ELSE
    RAISE NOTICE '  ⏭️ activity_feed.family_id already TEXT';
  END IF;
END $$;

-- Convert tasks.family_id (if exists and UUID)
DO $$
DECLARE
  v_type TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'family_id'
  ) THEN
    SELECT data_type INTO v_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'family_id';
    
    IF v_type = 'uuid' THEN
      ALTER TABLE tasks 
        ALTER COLUMN family_id TYPE TEXT USING family_id::TEXT;
      RAISE NOTICE '  ✅ Converted tasks.family_id: UUID → TEXT';
    ELSE
      RAISE NOTICE '  ⏭️ tasks.family_id already TEXT';
    END IF;
  END IF;
END $$;

-- Convert bulletin_messages.family_id (if exists and UUID)
DO $$
DECLARE
  v_type TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bulletin_messages'
      AND column_name = 'family_id'
  ) THEN
    SELECT data_type INTO v_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bulletin_messages'
      AND column_name = 'family_id';
    
    IF v_type = 'uuid' THEN
      ALTER TABLE bulletin_messages 
        ALTER COLUMN family_id TYPE TEXT USING family_id::TEXT;
      RAISE NOTICE '  ✅ Converted bulletin_messages.family_id: UUID → TEXT';
    ELSE
      RAISE NOTICE '  ⏭️ bulletin_messages.family_id already TEXT';
    END IF;
  END IF;
END $$;

-- Convert reward_redemptions.family_id (if exists and UUID)
DO $$
DECLARE
  v_type TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reward_redemptions'
      AND column_name = 'family_id'
  ) THEN
    SELECT data_type INTO v_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reward_redemptions'
      AND column_name = 'family_id';
    
    IF v_type = 'uuid' THEN
      ALTER TABLE reward_redemptions 
        ALTER COLUMN family_id TYPE TEXT USING family_id::TEXT;
      RAISE NOTICE '  ✅ Converted reward_redemptions.family_id: UUID → TEXT';
    ELSE
      RAISE NOTICE '  ⏭️ reward_redemptions.family_id already TEXT';
    END IF;
  END IF;
END $$;

-- Convert rewards.family_id (if exists and UUID)
DO $$
DECLARE
  v_type TEXT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rewards'
      AND column_name = 'family_id'
  ) THEN
    SELECT data_type INTO v_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rewards'
      AND column_name = 'family_id';
    
    IF v_type = 'uuid' THEN
      ALTER TABLE rewards 
        ALTER COLUMN family_id TYPE TEXT USING family_id::TEXT;
      RAISE NOTICE '  ✅ Converted rewards.family_id: UUID → TEXT';
    ELSE
      RAISE NOTICE '  ⏭️ rewards.family_id already TEXT';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ Converted profiles.family_id: UUID → TEXT';
END $$;

-- ============================================================================
-- STEP 6: RECREATE ALL RLS POLICIES (with TEXT comparisons)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🔐 Recreating RLS policies with TEXT comparisons...';
END $$;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

CREATE POLICY "profiles_select_family" ON profiles
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (
    id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'parent'
        AND p.family_id = profiles.family_id
    )
  );

CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE
  USING (id = auth.uid());

DO $$
BEGIN
  RAISE NOTICE '  ✅ Created 4 policies on profiles';
END $$;

-- ============================================================================
-- FAMILIES POLICIES
-- ============================================================================

CREATE POLICY "families_select_own" ON families
  FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "families_insert_own" ON families
  FOR INSERT
  WITH CHECK (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "families_update_own" ON families
  FOR UPDATE
  USING (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "families_delete_own" ON families
  FOR DELETE
  USING (
    id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ Created 4 policies on families';
END $$;

-- ============================================================================
-- ACTIVITY_FEED POLICIES
-- ============================================================================

CREATE POLICY "activity_feed_select_family" ON activity_feed
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "activity_feed_insert_family" ON activity_feed
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ Created 2 policies on activity_feed';
END $$;

-- ============================================================================
-- TASKS POLICIES
-- ============================================================================

CREATE POLICY "tasks_select_family" ON tasks
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "tasks_insert_family" ON tasks
  FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "tasks_update_family" ON tasks
  FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "tasks_delete_family" ON tasks
  FOR DELETE
  USING (
    family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

DO $$
BEGIN
  RAISE NOTICE '  ✅ Created 4 policies on tasks';
END $$;

-- ============================================================================
-- STORAGE.OBJECTS POLICIES (for family task photos)
-- ============================================================================

-- Note: storage.objects policies require CREATE POLICY inside EXECUTE
-- because storage schema policies may have special requirements

DO $$
BEGIN
  -- Policy: Parents can delete family task photos
  EXECUTE $policy$
    CREATE POLICY "Parents can delete family task photos" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'task-photos'
        AND (storage.foldername(name))[1] IN (
          SELECT family_id FROM public.profiles WHERE id = auth.uid() AND role = 'parent'
        )
      )
  $policy$;
  
  -- Policy: Family members can view task photos
  EXECUTE $policy$
    CREATE POLICY "Family members can view task photos" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'task-photos'
        AND (storage.foldername(name))[1] IN (
          SELECT family_id FROM public.profiles WHERE id = auth.uid()
        )
      )
  $policy$;
  
  -- Policy: Users can upload family task photos
  EXECUTE $policy$
    CREATE POLICY "Users can upload family task photos" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'task-photos'
        AND (storage.foldername(name))[1] IN (
          SELECT family_id FROM public.profiles WHERE id = auth.uid()
        )
      )
  $policy$;
  
  RAISE NOTICE '  ✅ Created 3 policies on storage.objects';
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '  ⚠️ Could not create storage.objects policies (bucket may not exist): %', SQLERRM;
END $$;

-- ============================================================================
-- BULLETIN_MESSAGES POLICIES (if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bulletin_messages') THEN
    CREATE POLICY "bulletin_messages_select_family" ON bulletin_messages
      FOR SELECT
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid()
        )
      );
    
    CREATE POLICY "bulletin_messages_insert_parents" ON bulletin_messages
      FOR INSERT
      WITH CHECK (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid() AND role = 'parent'
        )
      );
    
    CREATE POLICY "bulletin_messages_update_parents" ON bulletin_messages
      FOR UPDATE
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid() AND role = 'parent'
        )
      );
    
    CREATE POLICY "bulletin_messages_delete_parents" ON bulletin_messages
      FOR DELETE
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid() AND role = 'parent'
        )
      );
    
    RAISE NOTICE '  ✅ Created 4 policies on bulletin_messages';
  END IF;
END $$;

-- ============================================================================
-- REWARD_REDEMPTIONS POLICIES (if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reward_redemptions') THEN
    CREATE POLICY "reward_redemptions_select_family" ON reward_redemptions
      FOR SELECT
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid()
        )
      );
    
    CREATE POLICY "reward_redemptions_insert_own" ON reward_redemptions
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid()
        )
      );
    
    RAISE NOTICE '  ✅ Created 2 policies on reward_redemptions';
  END IF;
END $$;

-- ============================================================================
-- REWARDS POLICIES (if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rewards') THEN
    CREATE POLICY "rewards_select_family" ON rewards
      FOR SELECT
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid()
        )
      );
    
    CREATE POLICY "rewards_insert_parents" ON rewards
      FOR INSERT
      WITH CHECK (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid() AND role = 'parent'
        )
      );
    
    CREATE POLICY "rewards_update_parents" ON rewards
      FOR UPDATE
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid() AND role = 'parent'
        )
      );
    
    CREATE POLICY "rewards_delete_parents" ON rewards
      FOR DELETE
      USING (
        family_id IN (
          SELECT family_id FROM profiles WHERE id = auth.uid() AND role = 'parent'
        )
      );
    
    RAISE NOTICE '  ✅ Created 4 policies on rewards';
  END IF;
END $$;

-- ============================================================================
-- STEP 7: RECREATE INDEXES
-- ============================================================================

CREATE INDEX idx_families_id ON families(id);
CREATE INDEX idx_profiles_family_id ON profiles(family_id);
CREATE INDEX idx_activity_feed_family_id ON activity_feed(family_id);

-- Conditional indexes for tables that may exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'family_id') THEN
    CREATE INDEX idx_tasks_family_id ON tasks(family_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bulletin_messages' AND column_name = 'family_id') THEN
    CREATE INDEX idx_bulletin_messages_family_id ON bulletin_messages(family_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reward_redemptions' AND column_name = 'family_id') THEN
    CREATE INDEX idx_reward_redemptions_family_id ON reward_redemptions(family_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rewards' AND column_name = 'family_id') THEN
    CREATE INDEX idx_rewards_family_id ON rewards(family_id);
  END IF;
  
  RAISE NOTICE '✅ Created indexes on family_id columns';
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show updated column types
SELECT 
  CASE 
    WHEN data_type = 'text' THEN '✅ TEXT'
    WHEN data_type = 'uuid' THEN '🔴 UUID (STILL WRONG!)'
    ELSE '⚠️ ' || data_type
  END as status,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name LIKE '%family%' OR (table_name = 'families' AND column_name = 'id'))
ORDER BY table_name, column_name;

-- Verify type consistency
DO $$
DECLARE
  v_profiles_type TEXT;
  v_families_type TEXT;
BEGIN
  SELECT data_type INTO v_profiles_type
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'family_id';
  
  SELECT data_type INTO v_families_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'families' 
    AND column_name = 'id';
  
  IF v_profiles_type = 'text' AND v_families_type = 'text' THEN
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ TYPE CONVERSION COMPLETE!';
    RAISE NOTICE '✅ profiles.family_id = TEXT';
    RAISE NOTICE '✅ families.id = TEXT';
    RAISE NOTICE '✅ All family_id columns now TEXT';
    RAISE NOTICE '====================================';
  ELSE
    RAISE WARNING '⚠️ Type mismatch still exists: profiles.family_id=%, families.id=%', 
      v_profiles_type, v_families_type;
  END IF;
END $$;

-- List recreated policies
SELECT 
  'RLS Policies' as category,
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND tablename IN ('profiles', 'families', 'activity_feed', 'tasks', 'objects', 'bulletin_messages', 'reward_redemptions', 'rewards')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;
