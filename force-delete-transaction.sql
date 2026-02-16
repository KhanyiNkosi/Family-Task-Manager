-- ============================================================================
-- FORCE DELETE - Single transaction, ignore RLS
-- ============================================================================
-- If step-by-step failed, try this version
-- Uses transaction to ensure all-or-nothing
-- ============================================================================

BEGIN;

-- Disable RLS temporarily for this transaction (if you have permission)
SET LOCAL row_security = off;

-- Delete in order
DELETE FROM profiles WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';
DELETE FROM families WHERE id = '3c2388ee-148a-4b3c-9a2e-f56236826946';
DELETE FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';

-- Verify
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e') THEN
    RAISE EXCEPTION 'User still exists - rolling back';
  END IF;
  
  RAISE NOTICE '✅ All records deleted successfully';
END $$;

COMMIT;

-- Final check
SELECT '✅ DELETION COMPLETE!' as status;
