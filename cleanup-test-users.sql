-- Cleanup Test Users and Prepare for Fresh Testing
-- Run this in Supabase SQL Editor before testing registration

-- ============================================
-- STEP 1: VIEW ALL TEST/UNCONFIRMED USERS
-- ============================================
-- See what we're about to delete
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    CASE 
        WHEN confirmed_at IS NOT NULL THEN '✅ Confirmed (KEEP)'
        WHEN email LIKE '%test%' OR email LIKE '%delete%' THEN '🧹 Test user (DELETE)'
        WHEN confirmed_at IS NULL AND created_at < NOW() - INTERVAL '1 hour' THEN '⏰ Old unconfirmed (DELETE)'
        ELSE '⏳ Recent unconfirmed (REVIEW)'
    END as action
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- STEP 2: DELETE TEST PLACEHOLDER USER
-- ============================================
-- Remove the 00000000-0000-0000-0000-000000000002 placeholder
DELETE FROM auth.users 
WHERE id = '00000000-0000-0000-0000-000000000002'
   OR email = 'test-delete@example.com';

-- Verification
SELECT 'Placeholder user deleted' as status, COUNT(*) as removed_count
FROM auth.users
WHERE id = '00000000-0000-0000-0000-000000000002';

-- ============================================
-- STEP 3: DELETE OLD UNCONFIRMED USERS (>1h)
-- ============================================
-- Remove users who registered but never confirmed (older than 1 hour)
DELETE FROM auth.users 
WHERE confirmed_at IS NULL 
  AND created_at < NOW() - INTERVAL '1 hour'
  AND email NOT LIKE '%test%'; -- Keep test emails for separate handling

-- Verification
SELECT 'Old unconfirmed users deleted' as status;

-- ============================================
-- STEP 4: DELETE SPECIFIC PROTON.COM ATTEMPTS (if duplicate)
-- ============================================
-- If kaykaynk@proton.com exists and is unconfirmed, remove it
DELETE FROM auth.users 
WHERE email ILIKE 'kaykaynk@proton.com'
  AND confirmed_at IS NULL;

-- Also remove the .me variant if it exists and is unconfirmed
DELETE FROM auth.users 
WHERE email ILIKE 'kaykaynk@proton.me'
  AND confirmed_at IS NULL;

-- Verification
SELECT 'Kay Kay test accounts cleared' as status;

-- ============================================
-- STEP 5: VIEW REMAINING USERS
-- ============================================
-- Check what's left after cleanup
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) as confirmed,
    COUNT(CASE WHEN confirmed_at IS NULL THEN 1 END) as unconfirmed,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h
FROM auth.users;

-- ============================================
-- STEP 6: LIST REMAINING ACTIVE USERS
-- ============================================
-- Show all confirmed users (your real users)
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    '✅ Active user' as status
FROM auth.users
WHERE confirmed_at IS NOT NULL
ORDER BY created_at DESC;

-- ============================================
-- NOTES
-- ============================================
/*
After running this cleanup:

1. Test registration again:
   - Use a FRESH email (not kaykaynk@proton.com or .me)
   - Try a gmail or other common provider first
   - Example: yourtestname@gmail.com

2. If STILL getting "Error sending confirmation email":
   
   This means SMTP is NOT configured properly. Check:
   
   A) Supabase Dashboard → Settings → Authentication → SMTP Settings
   
      ✅ Enable Custom SMTP: Toggle MUST be ON (blue)
      ✅ Sender email: delivered@resend.dev
      ✅ Sender name: FamilyTask
      ✅ Host: smtp.resend.com
      ✅ Port: 587
      ✅ Username: resend (exactly this, lowercase)
      ✅ Password: re_[your-api-key-from-resend]
   
   B) SAVE Button: You MUST click "Save" after entering credentials
   
   C) Wait: After saving, wait 2-3 minutes before testing
   
   D) Test in Resend Dashboard:
      - Go to https://resend.com/emails
      - If no emails appear after registration attempt → SMTP not connected
      - If emails appear as "Delivered" → SMTP working, check spam folder
      - If emails appear as "Rejected" → Domain/sender issue

3. Common mistakes that cause this error:
   
   ❌ Username is your email → Should be "resend"
   ❌ Password is blank → Should be your API key
   ❌ Toggle is OFF → Must be ON
   ❌ Didn't click Save → Changes not applied
   ❌ Sender email is @gmail.com → Must be delivered@resend.dev
   ❌ Port is 25 or 465 → Must be 587

4. Nuclear option (if nothing works):
   
   Temporarily DISABLE email confirmation:
   
   Supabase Dashboard → Authentication → Email Auth
   → Toggle OFF "Enable email confirmations"
   
   This allows users to register without email verification.
   ⚠️ Only use for testing! Re-enable for production!

*/
