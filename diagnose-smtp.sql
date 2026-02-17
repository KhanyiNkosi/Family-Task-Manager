-- SMTP Configuration Diagnostic
-- Run this in Supabase SQL Editor to debug email issues

-- ============================================
-- 1. CHECK RECENT REGISTRATION ATTEMPTS
-- ============================================
-- See if users are being created despite email error
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    email_confirmed_at,
    confirmation_sent_at,
    CASE 
        WHEN confirmed_at IS NOT NULL THEN '✅ Confirmed'
        WHEN confirmation_sent_at IS NULL THEN '❌ Email NOT sent'
        ELSE '⏳ Email sent, awaiting confirmation'
    END as email_status,
    EXTRACT(MINUTE FROM (NOW() - created_at)) || ' min ago' as time_ago
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 2. CHECK UNCONFIRMED USERS (Last 24h)
-- ============================================
-- These users registered but confirmation email failed
SELECT 
    COUNT(*) as total_unconfirmed,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '5 minutes' THEN 1 END) as last_5_min
FROM auth.users
WHERE confirmed_at IS NULL
  AND created_at >= NOW() - INTERVAL '24 hours';

-- ============================================
-- 3. LIST UNCONFIRMED EMAILS
-- ============================================
-- Show actual emails that didn't receive confirmation
SELECT 
    email,
    created_at,
    CASE 
        WHEN confirmation_sent_at IS NULL THEN '❌ Email never sent'
        ELSE '📧 Email sent but not confirmed'
    END as issue
FROM auth.users
WHERE confirmed_at IS NULL
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================
-- TROUBLESHOOTING STEPS
-- ============================================
/*

ERROR: "Error sending confirmation email"

This means Supabase couldn't send the email. Common causes:

1. ❌ SMTP NOT CONFIGURED
   - Check: Supabase > Settings > Authentication > SMTP Settings
   - Verify: "Enable Custom SMTP" toggle is ON
   - Verify: All fields are filled and saved

2. ❌ WRONG SMTP CREDENTIALS
   - Username MUST be: resend
   - Password MUST be: Your Resend API key (starts with re_)
   - Host MUST be: smtp.resend.com
   - Port MUST be: 587

3. ❌ INVALID SENDER EMAIL
   - For testing: delivered@resend.dev
   - For production: Must be verified domain (e.g., noreply@yourdomain.com)
   - Cannot use: @gmail.com, @yahoo.com, etc.

4. ❌ RESEND API KEY ISSUES
   - Check: API key has "Sending access" permission
   - Check: API key is not revoked
   - Try: Generate a new API key in Resend dashboard

5. ❌ NETWORK/FIREWALL ISSUES
   - Supabase must be able to reach smtp.resend.com:587
   - Usually not an issue with Resend

HOW TO FIX:

Step 1: Verify SMTP Settings in Supabase
-----------------------------------------
1. Go to: Supabase Dashboard > Settings > Authentication
2. Scroll to: SMTP Settings
3. Check toggle: "Enable Custom SMTP" is ON
4. Verify all fields:
   
   Sender email:    delivered@resend.dev
   Sender name:     FamilyTask
   Host:            smtp.resend.com
   Port:            587
   Username:        resend
   Password:        re_[your-actual-api-key]

5. Click "Save" (important!)

Step 2: Test with Resend Dashboard
-----------------------------------
1. Go to: https://resend.com/api-keys
2. Click on "Family-task" key
3. Test it with a simple curl command:

   curl -X POST 'https://api.resend.com/emails' \
     -H 'Authorization: Bearer re_[your-api-key]' \
     -H 'Content-Type: application/json' \
     -d '{
       "from": "delivered@resend.dev",
       "to": "your-email@example.com",
       "subject": "Test Email",
       "html": "<p>Testing Resend</p>"
     }'

Step 3: Check Supabase Auth Logs
---------------------------------
1. Go to: Supabase Dashboard > Logs > Auth Logs
2. Look for recent signup attempts
3. Check for SMTP error messages
4. Common errors:
   - "SMTP connection failed" → Wrong host/port
   - "Authentication failed" → Wrong credentials
   - "Sender rejected" → Invalid sender email

Step 4: Try Again
-----------------
After fixing SMTP settings:
1. Wait 1-2 minutes for Supabase to reload config
2. Try registering a new account
3. Check your email inbox (and spam folder)
4. Check Resend dashboard at https://resend.com/emails

Step 5: Delete Failed Users (Optional)
---------------------------------------
If you have test users stuck in unconfirmed state:

-- Delete specific user by email
DELETE FROM auth.users 
WHERE email = 'test@example.com' 
  AND confirmed_at IS NULL;

-- Or delete all unconfirmed users from last hour
DELETE FROM auth.users 
WHERE confirmed_at IS NULL 
  AND created_at >= NOW() - INTERVAL '1 hour';

QUICK CHECKLIST:
□ Custom SMTP toggle is ON
□ Host is smtp.resend.com
□ Port is 587
□ Username is "resend" (not your email)
□ Password is your Resend API key (re_xxxxx)
□ Sender email is delivered@resend.dev (for testing)
□ Clicked "Save" in Supabase SMTP settings
□ Waited 1-2 minutes after saving
□ API key has "Sending access" permission
□ API key is not revoked in Resend

STILL NOT WORKING?
1. Generate a NEW API key in Resend dashboard
2. Update Supabase SMTP settings with new key
3. Save and wait 2 minutes
4. Try registration again
5. Check Resend logs at https://resend.com/emails

*/
