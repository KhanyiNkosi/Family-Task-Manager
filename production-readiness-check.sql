-- Production Readiness Check
-- Comprehensive verification before launch

-- ============================================
-- 1. USER STATISTICS
-- ============================================
SELECT 
    '📊 USER STATS' as category,
    COUNT(*) as total_users,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN confirmed_at IS NULL THEN 1 END) as awaiting_confirmation,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as signups_last_24h,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '1 hour' THEN 1 END) as signups_last_hour
FROM auth.users;

-- ============================================
-- 2. EMAIL DELIVERY SUCCESS RATE
-- ============================================
SELECT 
    '📧 EMAIL SUCCESS RATE' as category,
    COUNT(*) as total_signups,
    COUNT(CASE WHEN confirmation_sent_at IS NOT NULL THEN 1 END) as emails_sent,
    COUNT(CASE WHEN confirmation_sent_at IS NULL THEN 1 END) as emails_failed,
    ROUND(
        COUNT(CASE WHEN confirmation_sent_at IS NOT NULL THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) || '%' as success_rate
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- ============================================
-- 3. CONFIRMATION RATE
-- ============================================
SELECT 
    '✅ CONFIRMATION RATE' as category,
    COUNT(CASE WHEN confirmation_sent_at IS NOT NULL THEN 1 END) as emails_sent,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) as users_confirmed,
    ROUND(
        COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END)::numeric / 
        NULLIF(COUNT(CASE WHEN confirmation_sent_at IS NOT NULL THEN 1 END), 0) * 100, 
        2
    ) || '%' as click_through_rate
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- ============================================
-- 4. REGISTRATION CAPACITY CHECK
-- ============================================
SELECT 
    '🎯 CAPACITY CHECK' as category,
    (SELECT setting_value->>'limit' FROM app_settings WHERE setting_key = '
_users')::int as max_allowed_users,
    COUNT(*)::int as current_users,
    ((SELECT setting_value->>'limit' FROM app_settings WHERE setting_key = 'max_users')::int - COUNT(*))::int as slots_remaining,
    ROUND(
        COUNT(*)::numeric / 
        (SELECT setting_value->>'limit' FROM app_settings WHERE setting_key = 'max_users')::numeric * 100,
        2
    ) || '%' as capacity_used
FROM auth.users;

-- ============================================
-- 5. RECENT ACTIVITY (Last 10 Signups)
-- ============================================
SELECT 
    email,
    created_at,
    CASE 
        WHEN confirmed_at IS NOT NULL THEN '✅ Confirmed'
        WHEN confirmation_sent_at IS NULL THEN '❌ Email FAILED'
        ELSE '⏳ Pending confirmation'
    END as status,
    EXTRACT(MINUTE FROM (NOW() - created_at)) || ' min ago' as time_ago
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 6. SMTP HEALTH CHECK
-- ============================================
-- Check if emails are being sent successfully
WITH smtp_check AS (
    SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN confirmation_sent_at IS NOT NULL THEN 1 END) as successful_sends,
        COUNT(CASE WHEN confirmation_sent_at IS NULL THEN 1 END) as failed_sends
    FROM auth.users
    WHERE created_at >= NOW() - INTERVAL '1 hour'
)
SELECT 
    '🔧 SMTP HEALTH' as category,
    CASE 
        WHEN total_attempts = 0 THEN '⏸️ No recent activity'
        WHEN failed_sends = 0 THEN '✅ All emails sent successfully'
        WHEN successful_sends = 0 THEN '🔴 SMTP NOT WORKING - No emails sent'
        ELSE '⚠️ Partial failures - ' || failed_sends || ' of ' || total_attempts || ' failed'
    END as smtp_status,
    total_attempts as signups_last_hour,
    successful_sends as emails_sent,
    failed_sends as emails_failed
FROM smtp_check;

-- ============================================
-- 7. RATE LIMIT CHECK
-- ============================================
-- Check if we're hitting rate limits
SELECT 
    '⏱️ RATE LIMIT STATUS' as category,
    COUNT(*) as registrations_last_5min,
    CASE 
        WHEN COUNT(*) >= 30 THEN '🔴 At Supabase limit (30/5min)'
        WHEN COUNT(*) >= 20 THEN '⚠️ High load'
        WHEN COUNT(*) >= 10 THEN '✅ Moderate load'
        ELSE '✅ Normal load'
    END as rate_status
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '5 minutes';

-- ============================================
-- 8. FAMILY SYSTEM CHECK
-- ============================================
-- Verify families are being created
SELECT 
    '👨‍👩‍👧‍👦 FAMILY SYSTEM' as category,
    COUNT(DISTINCT family_id) as total_families,
    COUNT(CASE WHEN role = 'parent' THEN 1 END) as parents,
    COUNT(CASE WHEN role = 'child' THEN 1 END) as children,
    ROUND(
        COUNT(CASE WHEN role = 'child' THEN 1 END)::numeric / 
        NULLIF(COUNT(CASE WHEN role = 'parent' THEN 1 END), 0),
        2
    ) as avg_children_per_family
FROM profiles
WHERE family_id IS NOT NULL;

-- ============================================
-- 9. DATA INTEGRITY CHECK
-- ============================================
-- Check for orphaned profiles or inconsistencies
SELECT 
    '🔍 DATA INTEGRITY' as category,
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM profiles) as profiles,
    (SELECT COUNT(*) FROM families) as families,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM profiles) 
        THEN '✅ Auth/Profile sync OK'
        ELSE '⚠️ Mismatch detected'
    END as sync_status;

-- ============================================
-- 10. PRODUCTION READINESS SCORE
-- ============================================
WITH readiness_checks AS (
    SELECT 
        -- Check 1: SMTP working
        CASE WHEN (
            SELECT COUNT(CASE WHEN confirmation_sent_at IS NOT NULL THEN 1 END)::float / 
            NULLIF(COUNT(*), 0) >= 0.8
            FROM auth.users WHERE created_at >= NOW() - INTERVAL '24 hours'
        ) THEN 1 ELSE 0 END as smtp_ok,
        
        -- Check 2: Users confirmed
        CASE WHEN (
            SELECT COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) > 0
            FROM auth.users
        ) THEN 1 ELSE 0 END as confirmations_ok,
        
        -- Check 3: Capacity available
        CASE WHEN (
            SELECT COUNT(*)::float / (setting_value->>'limit')::float < 0.9
            FROM auth.users, app_settings 
            WHERE setting_key = 'max_users'
        ) THEN 1 ELSE 0 END as capacity_ok,
        
        -- Check 4: Families created
        CASE WHEN (
            SELECT COUNT(*) FROM families
        ) > 0 THEN 1 ELSE 0 END as families_ok,
        
        -- Check 5: No major data issues
        CASE WHEN (
            SELECT COUNT(*) FROM auth.users
        ) = (
            SELECT COUNT(*) FROM profiles
        ) THEN 1 ELSE 0 END as data_integrity_ok,
        
        -- Check 6: Recent activity
        CASE WHEN (
            SELECT COUNT(*) FROM auth.users 
            WHERE created_at >= NOW() - INTERVAL '24 hours'
        ) > 0 THEN 1 ELSE 0 END as activity_ok
)
SELECT 
    '🎯 READINESS SCORE' as category,
    (smtp_ok + confirmations_ok + capacity_ok + families_ok + data_integrity_ok + activity_ok) as score_out_of_6,
    CASE 
        WHEN (smtp_ok + confirmations_ok + capacity_ok + families_ok + data_integrity_ok + activity_ok) = 6 
        THEN '✅ READY FOR LAUNCH'
        WHEN (smtp_ok + confirmations_ok + capacity_ok + families_ok + data_integrity_ok + activity_ok) >= 4 
        THEN '⚠️ MOSTLY READY - Review failing checks'
        ELSE '🔴 NOT READY - Fix critical issues'
    END as status,
    CASE WHEN smtp_ok = 0 THEN '❌ SMTP not working' ELSE '✅ SMTP' END as smtp_check,
    CASE WHEN confirmations_ok = 0 THEN '❌ No confirmations' ELSE '✅ Confirmations' END as confirm_check,
    CASE WHEN capacity_ok = 0 THEN '⚠️ Near capacity limit' ELSE '✅ Capacity' END as capacity_check,
    CASE WHEN families_ok = 0 THEN '❌ No families' ELSE '✅ Families' END as families_check,
    CASE WHEN data_integrity_ok = 0 THEN '⚠️ Data mismatch' ELSE '✅ Data integrity' END as data_check,
    CASE WHEN activity_ok = 0 THEN '⏸️ No recent signups' ELSE '✅ Active' END as activity_check
FROM readiness_checks;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
/*
HOW TO READ THE RESULTS:

1. USER STATS
   - Should show growing user base
   - Awaiting confirmation should be low (<10%)

2. EMAIL SUCCESS RATE
   - Should be 100% or very close
   - If <80%: SMTP configuration problem

3. CONFIRMATION RATE
   - User behavior metric
   - 40-70% is normal (many don't confirm immediately)
   - <10%: Emails going to spam or wrong addresses

4. CAPACITY CHECK
   - Should show plenty of remaining slots
   - Alert if >80% capacity used

5. RECENT ACTIVITY
   - Shows last 10 signups with status
   - All should show "✅ Confirmed" or "⏳ Pending"
   - Any "❌ Email FAILED" means SMTP issue

6. SMTP HEALTH
   - Must show "✅ All emails sent successfully"
   - "🔴 SMTP NOT WORKING" = Critical issue
   - "⚠️ Partial failures" = Intermittent issues

7. RATE LIMIT STATUS
   - Normal load ideal
   - High/At limit = May need higher rate limits

8. FAMILY SYSTEM
   - Should show families being created
   - Avg 1-3 children per family is normal

9. DATA INTEGRITY
   - Must show "✅ Auth/Profile sync OK"
   - Mismatch indicates profile creation bug

10. READINESS SCORE
    - 6/6 = Perfect, ready to launch
    - 4-5/6 = Minor issues, can launch with monitoring
    - 0-3/6 = Critical issues, do not launch

CRITICAL ISSUES THAT MUST BE FIXED:
- SMTP not working (0% email success rate)
- Data integrity mismatch
- No registration capacity remaining

NON-CRITICAL (Can launch with):
- Low confirmation rate (user behavior)
- No recent activity (just means no recent signups)
- At rate limit (just shows high traffic)

*/
