# Parent Notifications Fix - Complete Solution

## Root Cause Identified ✅

**Problem**: The trigger condition `OLD.status IS DISTINCT FROM NEW.status OR OLD.approved_at IS NULL` was too restrictive. When approvals occur, the status may already be 'approved', so re-updating the row (e.g., changing `updated_at`) doesn't trigger notifications because OLD.status = NEW.status.

**Debug Results**: 
- Trigger fired correctly
- Condition evaluated FALSE because OLD.status = NEW.status = 'approved' 
- Function correctly skipped notification creation per the condition

## Solution Implemented ✅

Two-part fix:

### 1. **Idempotent Trigger Function** ([fix-parent-notifications-final-idempotent.sql](fix-parent-notifications-final-idempotent.sql))
   - **Removes** OLD.status/approved_at checks entirely
   - **Adds** metadata column to notifications table
   - **Implements** idempotency check: prevents duplicate notifications for same redemption
   - **Tracks** redemption_id in notification metadata for reliable deduplication
   - **Creates** notifications for BOTH parent and child on every approval/rejection

### 2. **Backfill Script** ([fix-parent-notifications-backfill.sql](fix-parent-notifications-backfill.sql))
   - **Finds** all approved/rejected redemptions without notifications
   - **Creates** missing notifications for both parent and child
   - **Preserves** original approval timestamps
   - **Marks** backfilled notifications with metadata flag

## Execution Order

### Step 1: Deploy Idempotent Function
```sql
-- Run: fix-parent-notifications-final-idempotent.sql
```

**What it does**:
- ✅ Adds metadata JSONB column to notifications
- ✅ Replaces trigger function with idempotent version
- ✅ Recreates trigger
- ✅ Tests with existing approved redemption
- ✅ Shows notifications created (if any)

**Expected output**:
- "Idempotent notification system deployed"
- Test results showing notifications created or noting idempotency
- Notification count statistics

### Step 2: Backfill Historical Data
```sql
-- Run: fix-parent-notifications-backfill.sql
```

**What it does**:
- 📊 Previews redemptions missing notifications
- 🔢 Counts how many will be backfilled
- 🔄 Creates missing child notifications
- 🔄 Creates missing parent notifications
- ✅ Verifies all redemptions now have notifications

**Expected output**:
- Count of approved/rejected redemptions needing backfill
- Progress messages as notifications are created
- "Backfill complete" with statistics
- Confirmation that all redemptions have notifications

### Step 3: Clean Up Debug Table (Optional)
```sql
DROP TABLE IF EXISTS notification_debug CASCADE;
```

## Testing After Deployment

### Test 1: New Approval Flow
1. Log in as child
2. Redeem a reward (e.g., "Extra Screen Time")
3. Log in as parent
4. Approve the reward redemption
5. **Verify**: Both parent and child receive notifications

### Test 2: Check Existing Notifications
1. Log in as parent
2. Navigate to parent dashboard
3. **Verify**: Notifications appear for past approvals (backfilled)
4. Check notification bell/icon shows count

### Test 3: Idempotency Check
1. Run the test update from fix-parent-notifications-final-idempotent.sql again
2. **Verify**: No duplicate notifications are created
3. Check logs confirm "notification already exists due to idempotency"

## Key Changes Made

### Database Changes
- ✅ Added `metadata` JSONB column to notifications table
- ✅ Updated `notify_reward_status_changed()` function
- ✅ Removed restrictive OLD.status condition
- ✅ Added idempotency check using metadata->>'redemption_id'

### Function Behavior (Before vs After)

**Before**:
```sql
IF (OLD.status = 'pending' OR OLD.status = 'requested') 
   AND NEW.status IN ('approved', 'rejected') THEN
  -- Create notifications
END IF;
```
❌ Only triggered on specific status transitions
❌ Missed approvals where status was already set
❌ No duplicate prevention

**After**:
```sql
IF NEW.status NOT IN ('approved', 'rejected') THEN
  RETURN NEW;  -- Exit early
END IF;

-- Check if notification already exists
IF EXISTS (SELECT 1 FROM notifications 
           WHERE metadata->>'redemption_id' = NEW.id::text) THEN
  RETURN NEW;  -- Idempotent: skip if already exists
END IF;

-- Create notifications with metadata tracking
```
✅ Triggers on ANY update to approved/rejected redemption
✅ Prevents duplicates using metadata lookup
✅ More reliable and maintainable

### Metadata Structure
```json
{
  "redemption_id": "uuid-of-redemption",
  "reward_id": "uuid-of-reward",
  "status": "approved" | "rejected",
  "recipient": "parent" | "child",
  "child_id": "uuid-of-child",
  "backfilled": true  // Only for backfilled notifications
}
```

## Verification Queries

### Check notification counts:
```sql
SELECT 
  COUNT(*) as total_reward_notifications,
  COUNT(*) FILTER (WHERE metadata->>'recipient' = 'parent') as parent_notifications,
  COUNT(*) FILTER (WHERE metadata->>'recipient' = 'child') as child_notifications,
  COUNT(*) FILTER (WHERE metadata->>'backfilled' = 'true') as backfilled_notifications
FROM notifications
WHERE metadata->>'redemption_id' IS NOT NULL;
```

### Find redemptions still missing notifications:
```sql
SELECT rr.id, rr.status, rr.approved_at, r.title
FROM reward_redemptions rr
JOIN rewards r ON r.id = rr.reward_id
WHERE rr.status IN ('approved', 'rejected')
  AND rr.approved_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.metadata->>'redemption_id' = rr.id::text
  );
```

### View recent notifications:
```sql
SELECT 
  n.title,
  n.message,
  n.metadata->>'recipient' as for_role,
  p.full_name as recipient,
  p.role,
  n.created_at
FROM notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.metadata->>'redemption_id' IS NOT NULL
ORDER BY n.created_at DESC
LIMIT 20;
```

## Files Summary

| File | Purpose | Run Order |
|------|---------|-----------|
| [debug-parent-notifications-with-table.sql](debug-parent-notifications-with-table.sql) | Debug script with execution flow tracking | ✅ Already run |
| [fix-parent-notifications-final-idempotent.sql](fix-parent-notifications-final-idempotent.sql) | Deploy idempotent trigger function | **1st** |
| [fix-parent-notifications-backfill.sql](fix-parent-notifications-backfill.sql) | Backfill historical notifications | **2nd** |

## Cleanup (After Verification)

Once you've confirmed notifications are working:

```sql
-- Remove debug table
DROP TABLE IF EXISTS notification_debug CASCADE;

-- Optional: Archive old SQL scripts (move to /old-fixes folder)
```

## Success Criteria

- ✅ Parents receive notifications when approving/rejecting rewards
- ✅ Children receive notifications when their rewards are approved/rejected
- ✅ No duplicate notifications are created
- ✅ Historical approved rewards now have notifications (backfilled)
- ✅ New approvals create notifications immediately
- ✅ System is idempotent (re-running doesn't create duplicates)

---

**Status**: Ready to deploy! Run the two SQL files in order.
