-- ============================================================================
-- OPTION A: CREATE MISSING FAMILIES RECORDS
-- ============================================================================
-- This creates families table entries for orphaned family_ids
-- Run this if the orphaned profiles SHOULD have valid families
-- ============================================================================

DO $$
DECLARE
  v_family_id UUID;
  v_created_count INTEGER := 0;
  v_parent_id UUID;
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Creating missing families records...';
  RAISE NOTICE '====================================';
  
  -- For each distinct orphaned family_id
  FOR v_family_id IN (
    SELECT DISTINCT p.family_id
    FROM profiles p
    WHERE p.family_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id)
  ) LOOP
    
    -- Try to find a parent in this family
    SELECT id INTO v_parent_id
    FROM profiles
    WHERE family_id = v_family_id AND role = 'parent'
    LIMIT 1;
    
    -- Create the family record (adapt based on your actual families table schema)
    -- Check what columns exist first
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'families' 
        AND column_name = 'created_by'
    ) THEN
      -- Has created_by column
      INSERT INTO families (id, created_at, created_by)
      VALUES (v_family_id, NOW(), v_parent_id)
      ON CONFLICT (id) DO NOTHING;
    ELSE
      -- No created_by column
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'families' 
          AND column_name = 'created_at'
      ) THEN
        INSERT INTO families (id, created_at)
        VALUES (v_family_id, NOW())
        ON CONFLICT (id) DO NOTHING;
      ELSE
        -- Minimal schema - just id
        INSERT INTO families (id)
        VALUES (v_family_id)
        ON CONFLICT (id) DO NOTHING;
      END IF;
    END IF;
    
    v_created_count := v_created_count + 1;
    RAISE NOTICE '✅ Created family record for family_id: %', v_family_id;
    
  END LOOP;
  
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ Created % family records', v_created_count;
  RAISE NOTICE '====================================';
END $$;

-- Verify the fix
SELECT 
  'Verification: Orphaned profiles after fix' as check_name,
  COUNT(*) as remaining_orphans
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM families f WHERE f.id = p.family_id
  );

-- Show created families
SELECT 
  'Newly Created Families' as check_name,
  f.id,
  f.created_at,
  COUNT(p.id) as member_count,
  STRING_AGG(p.email, ', ') as members
FROM families f
JOIN profiles p ON p.family_id = f.id
WHERE f.created_at > NOW() - INTERVAL '5 minutes'
GROUP BY f.id, f.created_at
ORDER BY f.created_at DESC;
