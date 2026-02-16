-- Quick check: Is deletion complete?
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
    THEN '❌ STILL EXISTS - Deletion not complete'
    ELSE '✅ DELETED - Ready to test new fix!'
  END as deletion_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e')
    THEN 'Wait or try manual delete below'
    ELSE 'Run: npm run dev, then test at /register'
  END as next_step;

-- If stuck, run this manual delete (only if above shows STILL EXISTS):
/*
DELETE FROM auth.users WHERE id = 'bd1bb7db-f19b-4d16-b61f-42632d414f2e';
*/
