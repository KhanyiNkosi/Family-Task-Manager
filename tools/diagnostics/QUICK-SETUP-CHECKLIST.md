# 🚀 Quick Setup Checklist

Complete these steps to activate all new features!

## ☑️ Already Done (Database)
- ✅ Gamification system (achievements, levels, streaks)
- ✅ Activity feed system (timeline, reactions, comments)
- ✅ Support tickets enhancement
- ✅ Database triggers for automatic activity logging
- ✅ UI pages built and navigation links added

---

## 📋 You Need To Do (5 Minutes)

### Step 1: Create Storage Bucket (2 minutes)

1. Open **Supabase Dashboard**: https://app.supabase.com/project/YOUR_PROJECT/storage/buckets
2. Click **"New bucket"** button
3. Fill in:
   - **Name**: `task-photos`
   - **Public**: ☑️ **Check this box**
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/heic`
4. Click **"Create bucket"**

### Step 2: Apply Storage Policies (3 minutes)

1. Go to **Supabase SQL Editor**: https://app.supabase.com/project/YOUR_PROJECT/sql
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- Drop existing policies first (idempotent - safe to run multiple times)
DROP POLICY IF EXISTS "Authenticated users can upload task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view family task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own task photos" ON storage.objects;
DROP POLICY IF EXISTS "Parents can delete family task photos" ON storage.objects;

-- Policy: Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload task photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view photos from their family
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

-- Policy: Parents can delete any family photos
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
```

4. Click **"Run"** or press `Ctrl/Cmd + Enter`
5. Verify you see success messages

---

## ✅ Testing (5 Minutes)

### Test Activity Feed
1. Login as a child
2. Navigate to **📰 Activity Feed** (in sidebar)
3. Complete a task
4. Return to Activity Feed → verify activity appears
5. Try adding a ❤️ reaction
6. Try adding a comment

### Test Achievements
1. While logged in as child
2. Navigate to **🏆 Badges** (in sidebar)
3. Verify "Getting Started" badge shows progress
4. Check your level and XP display
5. View your current streak

### Test Photo Upload
1. As a child, go to dashboard
2. Click **"Mark Complete"** on a task
3. Photo modal should appear
4. Try uploading a photo or taking one
5. Click **"✓ Complete"**
6. Login as parent → verify photo shows in task approval

---

## 🎯 Success Criteria

You'll know everything is working when:

- ✅ Activity feed updates when tasks are completed
- ✅ Reactions and comments work
- ✅ Badge progress shows correctly
- ✅ Level and XP update after tasks
- ✅ Photo upload works without errors
- ✅ Parents can see uploaded photos

---

## 🆘 Troubleshooting

### Photo Upload Fails
**Error**: "Failed to upload photo"
- **Fix**: Make sure you created the `task-photos` bucket
- **Fix**: Verify bucket is marked as **Public**
- **Fix**: Check storage policies were applied

### Can't See Activity Feed
**Error**: Page shows "No activities yet"
- **Fix**: Complete at least one task to generate activity
- **Fix**: Check database triggers were created (they were!)

### Achievements Not Showing
**Error**: Empty badges list
- **Fix**: The 14 starter badges should be pre-loaded
- **Fix**: Check `achievements` table has data: `SELECT * FROM achievements;`

### Storage Policy Error
**Error**: "Policies already exist"
- **Fix**: Policies can only be created once - this is normal if you run the SQL twice
- **Fix**: To recreate, first drop existing policies:

```sql
DROP POLICY IF EXISTS "Authenticated users can upload task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view family task photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own task photos" ON storage.objects;
DROP POLICY IF EXISTS "Parents can delete family task photos" ON storage.objects;
```

Then run the create policies SQL again.

---

## 📱 Mobile Testing

All features are responsive! Test on mobile:
- Photos use native camera via `capture="environment"`
- Activity feed scrolls smoothly
- Badges grid adjusts for small screens
- Navigation footer works on mobile

---

## 🎉 You're Done!

Once these checklist items are complete, all three new features will be fully functional!

**Total Time**: ~10 minutes
**Difficulty**: Easy (just copy/paste)

---

## 📚 Need More Info?

- **Full Guide**: See [NEW-FEATURES-SUMMARY.md](NEW-FEATURES-SUMMARY.md)
- **Photo Setup**: See [PHOTO-VERIFICATION-SETUP.md](PHOTO-VERIFICATION-SETUP.md)
- **Development Guide**: See [FEATURES-IMPLEMENTATION-GUIDE.md](FEATURES-IMPLEMENTATION-GUIDE.md)

Happy building! 🚀
