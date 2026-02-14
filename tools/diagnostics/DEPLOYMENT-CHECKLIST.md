# 🚀 DEPLOYMENT CHECKLIST

Complete these steps in order to deploy a fully functional Family Task Manager with gamification.

## ✅ Prerequisites
- [ ] Supabase project created
- [ ] Database connection established
- [ ] Storage bucket `task-photos` created (can be public or private)
- [ ] Environment variables set in `.env.local`

---

## 📋 SQL DEPLOYMENT ORDER

### 🎯 EASIEST METHOD: Run Single Combined File

**File:** `COMPLETE-DEPLOYMENT.sql`
**What it does:** Everything! This combines all critical fixes and gamification in one file.

**Just run this one file and you're done!** ✅

---

### 📚 ALTERNATIVE: Run Individual Files (Advanced)

If you prefer to run files separately or already ran some:

Run these SQL files in your Supabase SQL Editor **in this exact order**:

### 1️⃣ **fix-photo-and-activity-issues.sql** (CRITICAL)
**File:** `fix-photo-and-activity-issues.sql`
**What it does:**
- Adds `photo_url` and `photo_uploaded_at` columns to tasks table
- Fixes activity feed triggers to handle NULL family_id
- Adds error handling to prevent foreign key violations

**Test after running:**
- Try completing a task with photo upload
- Try skipping photo upload
- Verify no errors appear in console

---

### 2️⃣ **enable-gamification-automation.sql** (GAMIFICATION)
**File:** `enable-gamification-automation.sql`
**What it does:**
- Enables auto XP awarding on task approval (points × 10)
- Auto-unlocks achievements when criteria met
- Tracks daily streaks automatically
- Creates helper functions for gamification stats

**Test after running:**
```sql
-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%gamification%';
```

---

### 3️⃣ **setup-storage-policies.sql** (OPTIONAL, for private bucket)
**File:** `setup-storage-policies.sql`
**What it does:**
- Sets up RLS policies for task-photos bucket
- Family-scoped photo access
- Parents can delete any family photos

**Only run if:** You want private storage bucket with RLS
**Skip if:** Bucket is public (simpler but less secure)

---

## 🧪 TESTING CHECKLIST

### Child Dashboard Testing
- [ ] **Login as child**
- [ ] **Complete a task without photo**
  - Click "Mark Complete" → Skip Photo → Verify task marked complete
- [ ] **Complete a task with photo**
  - Click "Mark Complete" → Upload photo → Complete → Verify photo uploaded
- [ ] **Check activity feed**
  - Navigate to Activity Feed → Verify task completion appears
- [ ] **Check achievements page**
  - Navigate to Achievements → Verify badges show (locked initially)

### Parent Dashboard Testing
- [ ] **Login as parent**
- [ ] **View pending task approval**
  - Should see child's completed tasks in "Pending Approvals"
  - Should see photo if child uploaded one
- [ ] **Approve a task**
  - Click Approve → Task disappears from pending
  - Check that child's points updated correctly in family member card
- [ ] **Check activity feed**
  - Navigate to Activity Feed → Verify "Task Approved" activity appears
  - Try adding reaction (👍❤️🎉😮🔥)
  - Try adding comment

### Gamification Testing
- [ ] **Check XP awarded** (child dashboard)
  - Navigate to Achievements page
  - Verify XP increased after parent approval (should be task points × 10)
  - Example: 10 point task = 100 XP
- [ ] **Check achievement unlocked**
  - First task completed should unlock "Getting Started" badge
  - Verify badge shows in Achievements page
  - Verify achievement activity appears in Activity Feed
- [ ] **Check streak tracking**
  - Complete task today → Should show 1 day streak
  - Complete task tomorrow → Should show 2 day streak
  - Skip a day → Streak resets to 1

### Points Calculation Testing
- [ ] **Verify points match across dashboards**
  - Child dashboard: Show current points (earned - spent)
  - Parent dashboard: Show same points for child in family cards
  - Should calculate from approved tasks minus redemptions
  - **NO stored total_points column used**

### Photo Verification Testing
- [ ] **Upload photo with task**
  - File size under 5MB ✓
  - Image file types only ✓
  - Photo preview shows before upload ✓
- [ ] **View photo in parent approval**
  - Parent sees photo attached to pending task ✓
  - Photo displays correctly ✓
- [ ] **Cancel photo upload**
  - Click Cancel in photo modal → Modal closes, task not completed ✓

---

## 🐛 TROUBLESHOOTING

### Issue: "Could not find photo_url column"
**Solution:** Run `fix-photo-and-activity-issues.sql` first

### Issue: "Foreign key constraint violation on activity_feed"
**Solution:** Run `fix-photo-and-activity-issues.sql` - has NULL checks

### Issue: "Achievements not unlocking"
**Solution:** Verify gamification SQL ran successfully:
```sql
SELECT * FROM user_achievements WHERE user_id = '<your-user-id>';
SELECT * FROM user_levels WHERE user_id = '<your-user-id>';
```

### Issue: "Points don't match between dashboards"
**Solution:** Check that parent dashboard was updated to calculate points dynamically (not use total_points column)

### Issue: "Skip Photo button doesn't work"
**Solution:** Photo columns were missing - run `fix-photo-and-activity-issues.sql`

### Issue: "XP not awarded on task approval"
**Solution:** Check trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'task_approval_gamification_trigger';
```

---

## 🎯 FEATURE VERIFICATION

After deployment, verify these features work:

### Core Features
✅ Task creation (parent)
✅ Task completion (child)
✅ Task approval (parent)
✅ Task rejection (parent)
✅ Points calculation (dynamic from tasks/redemptions)
✅ Reward redemption system
✅ Family member management

### New Features (Recent)
✅ Photo verification on task completion
✅ Activity feed with reactions & comments
✅ Achievements/badges system
✅ XP and leveling system
✅ Streak tracking

### Automation Features
✅ Auto XP awarding on task approval
✅ Auto achievement unlocking
✅ Auto streak tracking
✅ Auto activity feed creation
✅ Real-time notifications

---

## 📊 SUCCESS CRITERIA

**Deployment is successful when:**
1. ✅ All SQL scripts run without errors
2. ✅ Child can complete tasks with/without photos
3. ✅ Parent can approve tasks and see photos
4. ✅ Points calculate correctly (no mismatches)
5. ✅ Activity feed shows task completions and approvals
6. ✅ Achievements unlock automatically
7. ✅ XP increases on task approval
8. ✅ Streaks track consecutive days
9. ✅ No console errors during normal usage
10. ✅ All dashboards load without errors

---

## 🚀 DEPLOYMENT COMPLETE!

Once all items checked:
1. Commit changes to git
2. Push to deployment branch
3. Monitor for errors in first 24 hours
4. Gather user feedback

**Congratulations! Your Family Task Manager is fully deployed! 🎉**
