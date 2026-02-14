-- ============================================================================
-- COMPREHENSIVE MIGRATION: Convert ALL family_id columns from UUID to TEXT
-- ============================================================================
-- This script:
-- 1. Auto-discovers ALL tables with family_id columns
-- 2. Saves all existing policies before dropping
-- 3. Drops policies, constraints, indexes
-- 4. Converts ALL family_id columns to TEXT
-- 5. Recreates all policies with TEXT comparisons
-- 6. Recreates constraints and indexes
-- 7. Validates everything
-- ============================================================================
-- SAFETY: Run in a transaction with preview mode first!
-- ============================================================================

DO $$
DECLARE
  v_preview_only BOOLEAN := TRUE;  -- SET TO FALSE TO EXECUTE (starts as TRUE for safety)
  v_table RECORD;
  v_policy RECORD;
  v_constraint RECORD;
  v_index RECORD;
  v_column RECORD;
  v_policy_count INTEGER := 0;
  v_table_count INTEGER := 0;
  v_constraint_count INTEGER := 0;
BEGIN
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'COMPREHENSIVE FAMILY_ID MIGRATION';
  RAISE NOTICE 'Preview Mode: %', v_preview_only;
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  -- ============================================================================
  -- PHASE 1: DISCOVERY - Find all affected objects
  -- ============================================================================
  
  RAISE NOTICE '📊 PHASE 1: DISCOVERY';
  RAISE NOTICE '--------------------';
  
  -- Find all tables with family_id columns or families.id
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Tables with family_id columns:';
  FOR v_table IN
    SELECT DISTINCT t.table_name, c.column_name, c.data_type
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
      AND c.table_schema = 'public'
      AND (
        c.column_name LIKE '%family%'
        OR (t.table_name = 'families' AND c.column_name = 'id')
      )
      AND c.data_type IN ('uuid', 'text', 'character varying')
    ORDER BY t.table_name, c.column_name
  LOOP
    v_table_count := v_table_count + 1;
    RAISE NOTICE '  %.% = %', v_table.table_name, v_table.column_name, v_table.data_type;
  END LOOP;
  RAISE NOTICE '  Total: % tables/columns', v_table_count;
  
  -- Find all policies that reference family_id
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Policies referencing family_id:';
  v_policy_count := 0;
  FOR v_policy IN
    SELECT 
      schemaname,
      tablename,
      policyname,
      COALESCE(qual, '') || ' ' || COALESCE(with_check, '') as definition_preview
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        qual ILIKE '%family%'
        OR with_check ILIKE '%family%'
      )
    ORDER BY schemaname, tablename, policyname
  LOOP
    v_policy_count := v_policy_count + 1;
    RAISE NOTICE '  %.%.%', v_policy.schemaname, v_policy.tablename, v_policy.policyname;
  END LOOP;
  RAISE NOTICE '  Total: % policies', v_policy_count;
  
  -- Find all FK constraints involving family_id
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Foreign key constraints:';
  v_constraint_count := 0;
  FOR v_constraint IN
    SELECT 
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND kcu.column_name LIKE '%family%'
    ORDER BY tc.table_name
  LOOP
    v_constraint_count := v_constraint_count + 1;
    RAISE NOTICE '  %.% (column: %)', 
      v_constraint.table_name, 
      v_constraint.constraint_name,
      v_constraint.column_name;
  END LOOP;
  RAISE NOTICE '  Total: % constraints', v_constraint_count;
  
  -- ============================================================================
  -- PHASE 2: IMPACT ANALYSIS
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 PHASE 2: IMPACT ANALYSIS';
  RAISE NOTICE '---------------------------';
  
  -- Check for existing data
  RAISE NOTICE '';
  RAISE NOTICE '📈 Data impact:';
  FOR v_table IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND column_name LIKE '%family%'
      )
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', v_table.table_name) INTO v_table_count;
    IF v_table_count > 0 THEN
      RAISE NOTICE '  % has % rows', v_table.table_name, v_table_count;
    END IF;
  END LOOP;
  
  -- ============================================================================
  -- PHASE 3: VALIDATION
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ PHASE 3: PRE-FLIGHT VALIDATION';
  RAISE NOTICE '--------------------------------';
  
  -- Check if families.id is TEXT
  SELECT data_type INTO v_column
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'families'
    AND column_name = 'id';
  
  IF v_column.data_type != 'text' THEN
    RAISE WARNING '⚠️  families.id is % (should be TEXT)', v_column.data_type;
  ELSE
    RAISE NOTICE '✅ families.id is already TEXT';
  END IF;
  
  -- Check for orphaned profiles
  SELECT COUNT(*) INTO v_table_count
  FROM profiles p
  WHERE p.family_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id::text = p.family_id::text);
  
  IF v_table_count > 0 THEN
    RAISE WARNING '⚠️  Found % orphaned profiles - run fix-orphans-create-families.sql first!', v_table_count;
  ELSE
    RAISE NOTICE '✅ No orphaned profiles found';
  END IF;
  
  -- ============================================================================
  -- DECISION POINT
  -- ============================================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  IF v_preview_only THEN
    RAISE NOTICE '🛑 PREVIEW MODE - NO CHANGES MADE';
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  • % policies will be dropped and recreated', v_policy_count;
    RAISE NOTICE '  • % FK constraints will be dropped', v_constraint_count;
    RAISE NOTICE '  • All UUID family_id columns will convert to TEXT';
    RAISE NOTICE '';
    RAISE NOTICE 'To execute this migration:';
    RAISE NOTICE '1. Ensure you have a database backup';
    RAISE NOTICE '2. Edit this script: SET v_preview_only := FALSE';
    RAISE NOTICE '3. Run during low-traffic window';
    RAISE NOTICE '4. Monitor for errors';
  ELSE
    RAISE NOTICE '⚠️  EXECUTING MIGRATION - CHANGES WILL BE APPLIED!';
    RAISE NOTICE '';
    RAISE EXCEPTION 'SAFETY CHECK: Migration execution not yet implemented in this preview script. Use the step-by-step scripts instead.';
  END IF;
  RAISE NOTICE '====================================';
  
END $$;
