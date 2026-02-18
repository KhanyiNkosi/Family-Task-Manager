# Manual Test Account Deletion Guide

## 🔍 Step 1: Identify Remaining Accounts

Run this in Supabase SQL Editor: [check-remaining-accounts.sql](check-remaining-accounts.sql)

This will show:
- Which of the 4 emails still exist
- Their user IDs
- Related data in profiles, tasks, etc.

---

## 🛠️ Step 2: Try Force Deletion Script

Run this in Supabase SQL Editor: [force-delete-test-accounts.sql](force-delete-test-accounts.sql)

This script:
- ✅ Deletes all related data first
- ✅ Uses aggressive deletion on auth.users
- ✅ Cleans up orphaned families
- ✅ Shows exactly what was deleted

---

## 🖱️ Step 3: Manual Deletion (If SQL Fails)

If accounts still remain after running the force delete script, delete them manually:

### Option A: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Search for each email:
   - `nkosik8@gmail.com`
   - `kometsilwandle@gmail.com`
   - `kometsinkanyezi@gmail.com`
   - `nkazimulokometsi@gmail.com`
3. Click the **⋮** menu next to each user
4. Select **"Delete user"**
5. Confirm deletion

✅ This bypasses all RLS policies and SQL permissions

### Option B: Supabase CLI (Alternative)

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref [your-project-ref]

# Delete user by ID
supabase db delete auth.users --where "email='nkosik8@gmail.com'"
```

---

## 🧹 Step 4: Clean Up Related Data

After deleting from auth.users, clean up any orphaned data:

```sql
-- Delete orphaned profiles (no matching auth.users)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Delete orphaned user_profiles
DELETE FROM public.user_profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- Delete orphaned tasks
DELETE FROM public.tasks
WHERE created_by NOT IN (SELECT id FROM auth.users)
   OR assigned_to NOT IN (SELECT id FROM auth.users);

-- Delete orphaned families (no members)
DELETE FROM public.families
WHERE id NOT IN (SELECT DISTINCT family_id FROM public.profiles WHERE family_id IS NOT NULL);
```

---

## ✅ Step 5: Verify Deletion

```sql
-- Should return 0
SELECT COUNT(*) as remaining_accounts
FROM auth.users
WHERE email IN (
  'nkosik8@gmail.com',
  'kometsilwandle@gmail.com',
  'kometsinkanyezi@gmail.com',
  'nkazimulokometsi@gmail.com'
);
```

---

## 🎯 Why SQL Deletion Might Fail

**Common reasons:**

1. **RLS Policies** - Row Level Security might block deletion
   - Solution: Use Supabase Dashboard (bypasses RLS)

2. **Insufficient Permissions** - SQL Editor might not have auth schema access
   - Solution: Use service role key or dashboard

3. **Foreign Key Constraints** - Related data blocks deletion
   - Solution: Our script deletes related data first

4. **Banned/Locked Accounts** - Special status prevents deletion
   - Solution: Unban first, then delete

---

## 🚀 After Deletion: Fresh Test Accounts

Once all accounts are deleted, you can register fresh test accounts:

### Test Account 1: First Parent
```
Email: nkosik8@gmail.com
Password: [your test password]
Name: Mom Test
Role: Parent
Join existing: ❌ (unchecked)
→ Creates new family, save family code
```

### Test Account 2: Second Parent
```
Email: kometsilwandle@gmail.com
Password: [your test password]
Name: Dad Test
Role: Parent
Join existing: ✅ (checked)
Family code: [paste from first parent]
→ Joins existing family
```

### Test Account 3: Try Third Parent (Should Fail)
```
Email: kometsinkanyezi@gmail.com
Role: Parent
Join existing: ✅ (checked)
Family code: [same code]
→ Should get error: "Maximum 2 parents per family"
```

### Test Account 4: Child
```
Email: nkazimulokometsi@gmail.com
Name: Child Test
Role: Child
Family code: [parent's family code]
→ Joins family as child
```

---

## 📋 Testing Checklist

After creating fresh accounts:

- [ ] 1st parent creates family, gets code
- [ ] 2nd parent joins using code
- [ ] Both parents see each other's tasks
- [ ] Task shows "Created by [name]"
- [ ] Create 3 tasks total (from both parents)
- [ ] Try 4th task → should fail with family limit message
- [ ] Try 3rd parent → should fail with 2-parent limit
- [ ] Child can join and see tasks
- [ ] Goals are separate per user (not shared)

---

**Good luck with testing! 🎉**
