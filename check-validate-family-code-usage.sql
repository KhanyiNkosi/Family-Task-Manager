-- ============================================================================
-- CHECK: Policies Using validate_family_code() 
-- ============================================================================
-- Identifies policies that should use validate_family_code_text() instead
-- ============================================================================

SELECT 
  'POLICIES USING validate_family_code()' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%validate_family_code(%' THEN 'In USING clause'
    WHEN with_check LIKE '%validate_family_code(%' THEN 'In WITH CHECK clause'
    ELSE 'Unknown'
  END as location
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND (
    qual LIKE '%validate_family_code(%'
    OR with_check LIKE '%validate_family_code(%'
  )
ORDER BY schemaname, tablename, policyname;

-- ============================================================================
-- RESULT INTERPRETATION
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies
  WHERE schemaname IN ('public', 'storage')
    AND (
      qual LIKE '%validate_family_code(%'
      OR with_check LIKE '%validate_family_code(%'
    );
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'validate_family_code() USAGE CHECK';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  
  IF v_count = 0 THEN
    RAISE NOTICE '✅ No policies using validate_family_code()';
    RAISE NOTICE 'No updates needed!';
  ELSE
    RAISE NOTICE '⚠️ Found % policies using validate_family_code()', v_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Recommendation: Update these policies to use validate_family_code_text()';
    RAISE NOTICE '';
    RAISE NOTICE 'Pattern to follow:';
    RAISE NOTICE '  OLD: ... FROM validate_family_code(code) v WHERE v.family_id::text = ...';
    RAISE NOTICE '  NEW: ... FROM validate_family_code_text(code) v WHERE v.family_id = ...';
    RAISE NOTICE '';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '  • No ::text casts needed';
    RAISE NOTICE '  • Consistent TEXT type throughout';
    RAISE NOTICE '  • Cleaner policy expressions';
  END IF;
  
  RAISE NOTICE '====================================';
END $$;
