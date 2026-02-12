-- ============================================================================
-- STORAGE POLICIES FOR task-photos BUCKET
-- Safe to run multiple times (idempotent)
-- ============================================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Authenticated users can upload task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view family task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own task photos" ON storage.objects;
DROP POLICY IF EXISTS "Parents can delete family task photos" ON storage.objects;

-- Policy: Authenticated users can upload photos to their own folder
CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view photos from their family members
CREATE POLICY "Users can view family task photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.family_id = p2.family_id
    WHERE p1.id = auth.uid()
    AND p2.id::text = (storage.foldername(name))[1]
  )
);

-- Policy: Users can delete their own photos
CREATE POLICY "Users can delete own task photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Parents can delete any family member's photos
CREATE POLICY "Parents can delete family task photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-photos'
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.family_id = p2.family_id
    WHERE p1.id = auth.uid()
    AND p1.role = 'parent'
    AND p2.id::text = (storage.foldername(name))[1]
  )
);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage policies applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '  • Authenticated users can upload photos to their folder';
  RAISE NOTICE '  • Family members can view each others photos';
  RAISE NOTICE '  • Users can delete their own photos';
  RAISE NOTICE '  • Parents can delete any family photos';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  • Test photo upload from child dashboard';
  RAISE NOTICE '  • Verify photos appear in parent approval screen';
END $$;
