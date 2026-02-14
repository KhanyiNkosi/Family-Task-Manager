# Database Schema Inspection - Run These Queries

Run these 7 queries **in order** in your Supabase SQL Editor and report back the results.

## Instructions

1. Open Supabase Dashboard → SQL Editor
2. Run each query below one at a time
3. Note the results (especially any missing tables or unexpected column names)
4. Report back with any ⚠️ warnings or unexpected results

---

## Query 1: List All Tables ⭐ CRITICAL
**File:** `inspect-1-list-tables.sql`

**What it does:** Shows all tables in your database

**What to look for:**
- ✓ Should see: `profiles`, `tasks`, `rewards`, `reward_redemptions`
- ✓ Check if `families` table exists
- ✓ Check if `support_tickets` exists

**Report back:** List of all table names

---

## Query 2: Profiles Table ⭐ CRITICAL
**File:** `inspect-2-profiles-table.sql`

**What it does:** Shows columns in profiles table

**What to look for:**
- ✓ Column named `id` (UUID)
- ✓ Column named `full_name` (could be `name` instead?)
- ✓ Column named `role` (TEXT - 'parent'/'child')
- ✓ Column named `family_id` (UUID)

**Report back:** 
- Does `full_name` exist or is it just `name`?
- Confirm `family_id` column exists

---

## Query 3: Tasks Table ⭐ CRITICAL
**File:** `inspect-3-tasks-table.sql`

**What it does:** Shows columns in tasks table

**What to look for:**
- ✓ Column for who task is assigned to: `assigned_to` OR `assignee_id`?
- ✓ Column named `completed` (BOOLEAN)
- ✓ Column named `approved` (BOOLEAN)
- ✓ Column named `points` (INTEGER)
- ✓ Column named `family_id` (UUID)

**Report back:** 
- **CRUCIAL:** Is it `assigned_to` or `assignee_id`? (This caused errors before)
- Confirm `completed` and `approved` columns exist

---

## Query 4: Families Table ⚠️ IMPORTANT
**File:** `inspect-4-families-table.sql`

**What it does:** Checks if families table exists

**What to look for:**
- Status message: "TABLE EXISTS ✓" or "TABLE MISSING ✗"
- If exists, what columns does it have?

**Report back:** 
- Does families table exist? (YES/NO)
- If YES, what columns does it have?

---

## Query 5: Support Tickets Table
**File:** `inspect-5-support-tickets-table.sql`

**What it does:** Shows exact column names

**What to look for:**
- Verify all expected columns exist
- Check for `assignee_id` vs `assigned_to` naming

**Report back:** 
- Any missing columns from the expected list?
- Column name for assignment: `assignee_id` or `assigned_to`?

---

## Query 6: Check for Conflicts
**File:** `inspect-6-check-conflicts.sql`

**What it does:** Checks if gamification/activity tables already exist

**What to look for:**
- Ideally: No results (tables don't exist yet)
- If results appear: ⚠️ Conflict detected

**Report back:** 
- Any results? (If empty, that's GOOD!)

---

## Query 7: Storage Buckets
**File:** `inspect-7-storage-buckets.sql`

**What it does:** Lists existing storage buckets

**What to look for:**
- Check if `task-photos` bucket exists

**Report back:** 
- Does `task-photos` bucket exist? (YES/NO)

---

## Quick Summary to Report

After running all 7 queries, please report back with:

```
1. All table names: [list them]

2. Profiles table has these key columns:
   - id: YES/NO
   - full_name or name: [which one?]
   - role: YES/NO
   - family_id: YES/NO

3. Tasks table assignment column is named: [assigned_to or assignee_id]

4. Families table exists: YES/NO

5. Any conflicting tables detected: YES/NO

6. task-photos storage bucket exists: YES/NO
```

Once I have these answers, I can:
- ✅ Confirm the SQL migrations are ready to run AS-IS
- 🔧 Adjust column names if needed
- 🆕 Create families table if missing
- 📝 Update photo storage setup instructions

---

## Next Step After Inspection

Once you report the results, I'll tell you which SQL files to run and in what order! 🚀
