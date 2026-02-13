# RLS Policy Fix - What Changed

## ❌ The Error You Encountered

```
ERROR: cannot alter type of a column used in a policy definition
CONTEXT: policy families_select_owner_or_member on table families depends on column "id"
```

**Why it happened:**
PostgreSQL won't let you change a column's data type if Row-Level Security (RLS) policies reference that column. The `families.id` column was being used in several RLS policies, blocking the TYPE conversion.

## ✅ The Solution

Updated [fix-families-type-mismatch.sql](fix-families-type-mismatch.sql) now handles RLS policies properly:

### New Execution Flow:

**Step 2: Backup & Drop RLS Policies**
- Shows all existing policies (for audit trail)
- Drops all policies on `families` table temporarily
- Policies dropped:
  - `families_select_owner_or_member` (SELECT)
  - `families_insert_parent` (INSERT)
  - `families_update_owner` (UPDATE)
  - `families_delete_owner` (DELETE)

**Step 3: Drop FK Constraints**
- Same as before

**Step 4: Convert Type**
- `families.id` TEXT → UUID (now works without RLS blocking!)

**Step 5: Fix family_code**
- Same as before

**Step 6: Add FK Constraints**
- Same as before

**Step 7: RECREATE RLS Policies** ⭐ NEW!
- Enables RLS on families table
- Recreates all 4 policies with correct logic:
  ```sql
  -- SELECT: Users can view their own family
  families_select_owner_or_member
  
  -- INSERT: Only parents can create families
  families_insert_parent
  
  -- UPDATE: Only family owners (parents) can update
  families_update_owner
  
  -- DELETE: Only family owners can delete
  families_delete_owner
  ```

**Step 8: Create Indexes**
- Same as before

**Step 9: Verification**
- Checks types match (UUID = UUID)
- Verifies FK constraints exist
- **NEW:** Verifies RLS policies were recreated ✅

## 🔒 Security Is Preserved

**Important:** The RLS policies are recreated with the **exact same logic** as before. Your security model hasn't changed - we just temporarily dropped them to allow the type conversion, then put them back.

### Policy Logic (Preserved):

1. **SELECT**: Users can only see families they belong to
   - Checks `profiles.family_id` matches the family's `id`

2. **INSERT**: Only parents can create new families
   - Checks user's role is 'parent' in profiles

3. **UPDATE**: Only family owners can modify family data
   - Checks user is a parent in that family

4. **DELETE**: Only family owners can delete families
   - Checks user is a parent in that family

## 📋 Ready to Execute

The updated script is now safe to run in Supabase SQL Editor:

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of [fix-families-type-mismatch.sql](fix-families-type-mismatch.sql)
3. Execute script
4. Watch the output for ✅ confirmations

**Expected output includes:**
```
✅ All families.id values are valid UUIDs
✅ Dropped all RLS policies on families table
✅ Converted families.id from TEXT to UUID
✅ Added FK constraint: profiles.family_id → families.id
✅ Created policy: families_select_owner_or_member
✅ Created policy: families_insert_parent
✅ Created policy: families_update_owner
✅ Created policy: families_delete_owner
✅ Type mismatch FIXED - both are UUID
```

## 🔍 What to Verify After Running

1. **Type conversion successful:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'families' AND column_name = 'id';
   -- Should show: uuid
   ```

2. **RLS policies recreated:**
   ```sql
   SELECT policyname, cmd 
   FROM pg_policies 
   WHERE tablename = 'families';
   -- Should show 4 policies
   ```

3. **FK constraints working:**
   ```sql
   SELECT constraint_name 
   FROM information_schema.table_constraints 
   WHERE table_name = 'profiles' 
     AND constraint_name = 'profiles_family_id_fkey';
   -- Should return 1 row
   ```

## 🚀 Next Steps

After successfully running this script:
1. ✅ Execute [fix-activity-feed-constraint.sql](fix-activity-feed-constraint.sql) - Repair orphaned data
2. ✅ Execute [fix-registration-flow.sql](fix-registration-flow.sql) - Fix registration trigger
3. ✅ Test application - Register parent → child → complete task
4. ✅ Push commits to GitHub

---

**Script is now production-ready!** The RLS policy handling makes it safe to run on your live database. Your security policies will be preserved throughout the migration.
