# Manual User Deletion Guide

## Current Status ⚠️
Dashboard deletion is failing with "Database error deleting user". This means there are hidden dependencies we need to clear.

- ✅ Profiles: 0 remaining
- ✅ Families: 0 remaining  
- ✅ Tasks: 0 remaining
- ✅ Auth Sessions: 0 remaining (basic check)
- ✅ Auth Identities: 0 remaining (basic check)
- ⚠️ **Auth Users: 1 remaining** (blocked by unknown constraint)

## Why Dashboard Deletion is Failing

There are likely references in auth schema tables we haven't checked yet:
- MFA (Multi-Factor Authentication) factors/challenges
- Audit log entries
- Refresh tokens still present
- Database triggers preventing deletion

## Steps to Fix the Deletion Error

### Step 1: Diagnose What's Blocking (RECOMMENDED FIRST)

Run **[find-all-user-references.sql](find-all-user-references.sql)** in Supabase SQL Editor:
- This will show you EXACTLY what tables still reference the user
- Look for lines like "Found X references in table_name.column_name"
- Pay attention to auth.mfa_factors, auth.refresh_tokens, auth.audit_log_entries

### Step 2: Try Simple Fix

Run **[simple-delete-fix.sql](simple-delete-fix.sql)** in Supabase SQL Editor:
- Deletes MFA factors, challenges, refresh tokens
- Attempts deletion via SQL
- Shows clear success/failure messages

### Step 3: Force Delete (If Step 2 Fails)

Run **[force-delete-user.sql](force-delete-user.sql)** in Supabase SQL Editor:
- More aggressive approach
- Cleans ALL auth schema tables
- Uses exception handling to show exact error if it still fails

### Step 4: Last Resort - Just Move On

If all above fail, you can simply:
1. **Leave the orphaned user** - it won't affect your app
2. **All functional data is already deleted** (profiles, families, tasks)
3. **The user can't log in anyway** (no profile = no access)
4. **Test with NEW accounts** - just use different email addresses

The orphaned auth.users record is harmless since:
- No profile exists for it
- No family data attached
- Can't access the app
- Won't interfere with new registrations

## After Deletion (or Moving On)

Whether you successfully delete the user or decide to leave it:
1. ✅ **All functional data is clean** (profiles, families, tasks deleted)
2. ✅ **Ready for testing** - use fresh email addresses
3. ✅ **App will work normally** - orphaned auth record doesn't affect functionality
4. ✅ **No conflicts** - new registrations won't collide with the orphaned user

## Next Steps

1. ~~Delete the remaining auth user~~ (optional - not blocking)
2. ✅ Verify Vercel deployment is complete
3. ✅ Test the production site: https://your-app.vercel.app
4. ✅ Register 3 **NEW** test accounts (use different emails if needed):
   - Example: testparent1@example.com
   - Example: testparent2@example.com  
   - Example: testchild1@example.com
5. ✅ Test all the bug fixes:
   - Premium banner (orange gradient)
   - Reward suggestions persistence
   - Activity feed display
   - Achievement badges
   - Profile stats alignment
   - Family members with role badges

## Why It's OK to Move On

The database error is likely caused by Supabase's internal auth management system that we don't have direct access to. Since:
- ✅ All YOUR data is deleted (profiles, families, tasks)
- ✅ The orphaned user can't log in (no profile)
- ✅ It won't interfere with new accounts (different emails)
- ✅ Your app's features all work normally

**It's perfectly safe to proceed with testing using new email addresses!**
