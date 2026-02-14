# 🧪 Production Testing Guide

## Overview
Test with real users to confirm the 409 Conflict error is resolved.

---

## Test 1: Existing Users (CRITICAL - Validates Fix)

### Family: 32af85db-12f6-4d60-9995-f585aa973ba3

**Who to contact:**
- Parent: nkosik8@gmail.com
- Child: (check profiles table for child email)

**Test Actions:**
1. Login as child user
2. Navigate to tasks page
3. Complete any pending task
4. **Open browser console** (F12 → Console tab)

**Expected Results:**
- ✅ Task marked as complete
- ✅ Activity feed shows new entry
- ✅ **NO 409 errors in console**
- ✅ No "family_id not present in table families" errors

**If 409 error appears:**
- Screenshot the error
- Check Supabase logs
- Report immediately

---

## Test 2: New Parent Registration

**Steps:**
1. Open app registration page
2. Sign up as parent:
   - Email: test-parent-feb14@example.com
   - Password: [secure password]
   - Role: Parent
   - Name: Test Parent

3. After successful signup, check Supabase:

**Verify in `families` table:**
```sql
SELECT * FROM families ORDER BY created_at DESC LIMIT 1;
```

Expected:
- ✅ New row created
- ✅ `id` is a TEXT value
- ✅ `owner_id` = parent's user ID
- ✅ `created_at` = today

**Verify in `profiles` table:**
```sql
SELECT * FROM profiles WHERE email = 'test-parent-feb14@example.com';
```

Expected:
- ✅ New profile exists
- ✅ `family_id` = families.id (same value)
- ✅ `role` = 'parent'

4. **Save the family_id** - you'll need it for Test 3

---

## Test 3: New Child Registration

**Prerequisites:**
- Use the family_id from Test 2 parent

**Steps:**
1. Open app registration page
2. Sign up as child:
   - Email: test-child-feb14@example.com
   - Password: [secure password]
   - Role: Child
   - Family Code: [paste family_id from Test 2]
   - Name: Test Child

3. After successful signup, verify in Supabase:

**Check `profiles` table:**
```sql
SELECT * FROM profiles WHERE email = 'test-child-feb14@example.com';
```

Expected:
- ✅ New profile exists
- ✅ `family_id` = parent's family_id (from Test 2)
- ✅ `role` = 'child'

4. **Login as the child** and complete a task

5. **Open browser console** (F12 → Console)

Expected:
- ✅ Task completes successfully
- ✅ NO 409 errors
- ✅ Activity feed updated

6. **Check activity_feed table:**
```sql
SELECT * FROM activity_feed 
WHERE family_id = '[family_id from Test 2]'
ORDER BY created_at DESC;
```

Expected:
- ✅ New entry created
- ✅ `family_id` matches families table
- ✅ `action` = 'task_completed'
- ✅ No FK violations

---

## Test 4: Family View (Parent)

**Steps:**
1. Login as parent (from Test 2)
2. View family dashboard
3. Check activity feed

Expected:
- ✅ Shows both parent and child
- ✅ Shows task completions
- ✅ Points awarded correctly
- ✅ No console errors

---

## Test 5: Edge Cases

### Test 5a: Invalid Family Code
**Steps:**
1. Try to register child with invalid family code: "invalid-123"

Expected:
- ❌ Registration fails
- ✅ Error message: "Invalid family code" or similar
- ✅ No profile created

### Test 5b: Child Registration Without Family Code
**Steps:**
1. Try to register child without entering family code

Expected:
- ❌ Registration fails
- ✅ Error: "Family code required for child accounts"

---

## Success Criteria

**Migration is successful if:**

1. ✅ Existing users (family 32af85db...) can complete tasks with NO 409 errors
2. ✅ New parent registrations automatically create `families` table entries
3. ✅ New children can join families using family codes
4. ✅ Task completions create `activity_feed` entries without errors
5. ✅ No FK violations in Supabase logs
6. ✅ No type mismatch errors ("operator does not exist: uuid = text")
7. ✅ All family_id references are valid (no orphans)

---

## Monitoring (Next 48 Hours)

### Check Daily:

**Orphan Check:**
```sql
SELECT COUNT(*) as orphaned_profiles
FROM profiles p
WHERE p.family_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM families f WHERE f.id = p.family_id);
```
Expected: Always 0

**FK Violations in Logs:**
- Open Supabase → Logs → Database
- Search for: "foreign key", "violates", "does not exist"
- Expected: No relevant errors

**New Registrations:**
```sql
SELECT 
  p.email,
  p.role,
  p.created_at,
  CASE 
    WHEN f.id IS NOT NULL THEN '✅ Family exists'
    ELSE '❌ Orphaned'
  END as status
FROM profiles p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.created_at > NOW() - INTERVAL '1 day'
ORDER BY p.created_at DESC;
```
Expected: All show "✅ Family exists"

---

## If Issues Arise

### Issue: 409 Errors Return

**Check:**
1. Are FK constraints active?
```sql
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND constraint_name LIKE '%family%';
```

2. Are there new orphans?
```sql
SELECT * FROM profiles p 
WHERE family_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM families WHERE id = p.family_id);
```

3. Is trigger active?
```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

**Solution:**
- If orphans found: Re-run `fix-orphans-create-families.sql`
- If FK missing: Re-run `add-foreign-keys.sql`
- If trigger disabled: Re-run `fix-registration-flow.sql`

---

### Issue: New Parents Don't Get Families

**Check:**
```sql
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_new_user';
```

**Look for:**
- `INSERT INTO public.families` statement
- Should happen for `v_role = 'parent'` branch

**Solution:**
- Re-run `fix-registration-flow.sql`
- Verify trigger recreated

---

### Issue: Type Errors Return

**Check:**
```sql
-- Should all be 'text'
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE column_name = 'family_id';

-- Should all be TEXT-returning
SELECT proname, pg_get_function_result(oid)
FROM pg_proc 
WHERE proname ILIKE '%family%';
```

**Solution:**
- If columns are UUID: Something reverted, check deployment
- If functions return UUID: Re-run function conversion scripts

---

## Rollback Plan (Emergency)

If critical issues arise and you need to rollback:

**DO NOT:**
- Try to convert back to UUID (RLS policies are now TEXT-based)
- Drop FK constraints without fixing orphans first

**DO:**
1. Fix orphans first: `fix-orphans-create-families.sql`
2. Ensure trigger is working: `fix-registration-flow.sql`
3. Contact users to pause testing
4. Review Supabase logs for root cause
5. Fix specific issue, don't rollback entire migration

---

## After Successful Testing

1. ✅ Confirm all 5 test cases pass
2. ✅ Monitor for 24-48 hours
3. ✅ Check for new orphans daily (should be 0)
4. ✅ Update documentation with success notes
5. ✅ Push to GitHub
6. ✅ Consider this migration closed

---

## Questions During Testing?

**Common issues:**

**Q: Can existing users still login?**
A: Yes, authentication is unchanged. Only family_id handling improved.

**Q: What if a child enters wrong family code?**
A: Registration fails with clear error. No profile created.

**Q: Will old activity_feed entries work?**
A: Yes, all existing data preserved. FK constraints added won't affect existing valid data.

**Q: What happens if I delete a parent?**
A: Depends on FK constraint: profiles → families (CASCADE), families (owner) → profiles (SET NULL). Family persists.

---

## Success! Next Steps After Testing

Once all tests pass:

1. **Document success** in project README
2. **Push all commits** to GitHub (34 commits)
3. **Update deployment logs** with migration notes
4. **Create backup** of database post-migration
5. **Archive migration scripts** in `/migrations/` folder
6. **Close migration issues** in project tracker
7. **Celebrate!** 🎉

You successfully completed a complex production database migration with zero downtime!
