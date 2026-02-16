# Reward Suggestions Fix - Summary

## Issues Fixed

### Issue 1: Reward suggestions not appearing on parent's rewards store page
**Root Cause**: The child's reward suggestion code was trying to find a parent user by querying:
```typescript
.from('profiles')
.eq('role', 'parent')
```

But the `role` column doesn't exist in the `profiles` table - it's in the `user_profiles` table.

**Solution**: Updated the parent lookup query in `/app/my-rewards/page.tsx` to properly join `user_profiles` table to find the parent:
```typescript
const { data: parentProfiles } = await supabase
  .from('user_profiles')
  .select('id, profiles!inner(id, family_id)')
  .eq('role', 'parent')
  .eq('profiles.family_id', childProfile.family_id)
  .limit(1);
```

### Issue 2: Redemptions query error on parent rewards store page
**Error**: 
```
Could not find a relationship between 'reward_redemptions' and 'profiles' in the schema cache
```

**Root Cause**: The query was trying to use an incorrect relationship syntax:
```typescript
.select(`
  *,
  reward:rewards(*),
  user:profiles(id, full_name)  // ❌ This relationship doesn't exist
`)
```

**Solution**: Changed to fetch user data separately and manually join:
```typescript
// 1. Load redemptions with rewards only
.select(`*, reward:rewards(*)`)

// 2. Get user data separately
const { data: usersData } = await supabase
  .from('profiles')
  .select('id, full_name')
  .in('id', userIds);

// 3. Manually join the data
const enrichedRedemptions = familyRedemptions.map(r => ({
  ...r,
  user: usersMap.get(r.user_id)
}));
```

## Files Modified

1. **app/my-rewards/page.tsx** (lines 378-421)
   - Fixed parent lookup to use proper join between `user_profiles` and `profiles` tables
   - Added fallback logic if initial lookup fails

2. **app/rewards-store/page.tsx** (lines 386-433)
   - Removed problematic `user:profiles` join from query
   - Added separate fetch for user data with manual join

## How to Test

### Test 1: Send a reward suggestion (Child)
1. Open the app in your browser (localhost:3000)
2. **Login as a CHILD user**
3. Navigate to "My Rewards" page
4. Click the **"Suggest Reward"** button (top right, lightbulb icon)
5. Fill in the reward suggestion form:
   - Reward Name (e.g., "Extra Screen Time")
   - Description (optional, e.g., "30 minutes extra gaming")
   - Points (e.g., 100)
6. Click **Submit**
7. You should see a success message: "Reward suggestion sent to parents!"

### Test 2: View and approve suggestion (Parent)
1. **Logout** from child account
2. **Login as a PARENT user**
3. Navigate to **"Rewards Store"** (/rewards-store)
4. You should see a **purple/pink box** at the top with "Child Reward Suggestions"
5. The suggestion you created should be listed there with:
   - Reward name and description
   - Suggested points
   - "Suggested by [Child Name]"
   - **Approve & Add** and **Reject** buttons
6. Click **"Approve & Add"**
7. The reward should:
   - Be added to the main rewards list below
   - Disappear from the suggestions section
   - Send a success notification to the child

### Test 3: View suggestion as notification (Parent)
1. When a child sends a suggestion, parent should also receive a **notification**
2. Click the **bell icon** in the header (if notifications are enabled)
3. You should see: "New Reward Suggestion 💡"
4. Clicking it should take you to the rewards store page

## Expected Behavior

### For Children:
- Can suggest new rewards from "My Rewards" page
- Receive confirmation when suggestion is sent
- Receive notification when parent approves/rejects suggestion

### For Parents:
- Receive notification when child suggests a reward
- See suggestions in a prominent section on rewards store page
- Can approve (adds to store) or reject (notifies child)
- Approved rewards immediately appear in family rewards store

## Technical Notes

### Database Structure
- **profiles** table: Contains `id`, `full_name`, `family_id` (no role column!)
- **user_profiles** table: Contains `id`, `role` (parent/child)
- **notifications** table: Contains suggestion data in `metadata` JSONB column

### Notification Metadata for Suggestions
```jsonb
{
  "suggestion_type": "reward",
  "reward_name": "Extra Screen Time",
  "reward_description": "30 minutes extra gaming",
  "suggested_points": 100,
  "suggested_by": "user-uuid",
  "suggested_by_name": "Child Name"
}
```

### Parent Lookup Logic
The code now uses this two-step approach:
1. Query `user_profiles` for role='parent'
2. Inner join with `profiles` to filter by `family_id`
3. This ensures we find the parent user in the same family

## Troubleshooting

### Suggestion doesn't appear on parent page
**Check**:
1. Is the parent logged in? (Check `/rewards-store` URL in browser)
2. Did the child successfully send the suggestion? (Check for success message)
3. Is there a parent user in the family? (Need at least one user with role='parent')
4. Check browser console for errors (F12 → Console tab)

### Error: "Could not find a parent to send suggestion to"
**Solution**:
- Ensure there's a user in the family with `role='parent'` in the `user_profiles` table
- Check if parent's `family_id` in `profiles` table matches child's `family_id`

### Suggestions don't load on rewards store page
**Check**:
1. Open browser console (F12)
2. Look for "Error loading suggestions" message
3. Check that `notifications` table has `metadata` column
4. Verify RLS policies allow parent to read notifications where `user_id = parent.id`

## Next Steps

1. ✅ Code fixes applied
2. 🧪 **Test the workflow** (see Test 1, 2, 3 above)
3. 🐛 If issues persist, check browser console and send error messages
4. 📊 Use `verify-reward-suggestions.mjs` for database-level debugging (requires service role key)

---

## Additional Files

- `verify-reward-suggestions.mjs` - Diagnostic script to check database state
- `check-user-tables.mjs` - Quick check of user tables (limited by RLS)

**Note**: Verification scripts use ANON key, so they're subject to RLS policies and may not show all data. For full diagnostics, use Supabase Dashboard SQL Editor.
