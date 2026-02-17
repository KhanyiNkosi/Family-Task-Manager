-- Monitor Rate Limits and Registration Activity
-- Run these queries in Supabase SQL Editor to track rate limit issues

-- ============================================
-- 1. RECENT REGISTRATION ATTEMPTS (Last Hour)
-- ============================================
-- Shows all user registrations in the last hour
SELECT 
    id,
    email,
    created_at,
    confirmed_at,
    CASE 
        WHEN confirmed_at IS NOT NULL THEN '✅ Confirmed'
        ELSE '⏳ Pending'
    END as status,
    EXTRACT(MINUTE FROM (NOW() - created_at)) || ' min ago' as time_ago
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- ============================================
-- 2. EMAIL RATE MONITORING
-- ============================================
-- Track emails sent per hour (helps identify rate limit issues)
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as registrations,
    COUNT(*) * 1 as emails_sent_approx, -- Each registration = 1 confirmation email
    CASE 
        WHEN COUNT(*) > 2 THEN '🔴 OVER LIMIT (>2)'
        WHEN COUNT(*) = 2 THEN '⚠️ AT LIMIT'
        ELSE '✅ OK'
    END as rate_limit_status
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- ============================================
-- 3. FAILED REGISTRATION TRACKING
-- ============================================
-- Note: Supabase doesn't log failed auth attempts in accessible tables
-- This shows unconfirmed registrations (potential rate limit victims)
SELECT 
    COUNT(*) as unconfirmed_count,
    MIN(created_at) as oldest_unconfirmed,
    MAX(created_at) as newest_unconfirmed
FROM auth.users
WHERE confirmed_at IS NULL
  AND created_at >= NOW() - INTERVAL '24 hours';

-- ============================================
-- 4. HOURLY REGISTRATION PATTERN (Last 24h)
-- ============================================
-- Visualize registration patterns to identify peak times
SELECT 
    EXTRACT(HOUR FROM created_at) as hour_of_day,
    COUNT(*) as total_registrations,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) as confirmed,
    COUNT(CASE WHEN confirmed_at IS NULL THEN 1 END) as unconfirmed,
    ROUND(
        COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as confirm_rate_percent
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day DESC;

-- ============================================
-- 5. CHECK CURRENT RATE LIMIT PRESSURE
-- ============================================
-- Shows registrations in last 5 minutes (helps identify immediate issues)
SELECT 
    COUNT(*) as registrations_last_5min,
    COUNT(*) * 1 as emails_sent,
    CASE 
        WHEN COUNT(*) >= 2 THEN '🔴 CRITICAL - Rate limit likely hit'
        WHEN COUNT(*) = 1 THEN '⚠️ WARNING - Close to limit'
        ELSE '✅ OK - No pressure'
    END as pressure_status
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '5 minutes';

-- ============================================
-- 6. USER REGISTRATION STATS (All Time)
-- ============================================
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
    ROUND(
        COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 
        2
    ) as confirmation_rate_percent,
    MIN(created_at) as first_registration,
    MAX(created_at) as last_registration
FROM auth.users;

-- ============================================
-- 7. UNCONFIRMED USERS (Potential Rate Limit Victims)
-- ============================================
-- Shows users who never confirmed - might be due to rate limits
SELECT 
    id,
    email,
    created_at,
    EXTRACT(HOUR FROM (NOW() - created_at)) || ' hours ago' as created_ago,
    CASE 
        WHEN created_at < NOW() - INTERVAL '24 hours' THEN '⚠️ Old - May need cleanup'
        ELSE '⏳ Recent'
    END as status
FROM auth.users
WHERE confirmed_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 8. RATE LIMIT RECOMMENDATIONS
-- ============================================
-- Based on current usage, show recommended rate limits
WITH hourly_stats AS (
    SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as registrations
    FROM auth.users
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY DATE_TRUNC('hour', created_at)
)
SELECT 
    'Recommended Settings' as category,
    MAX(registrations) as peak_registrations_per_hour,
    MAX(registrations) * 1 as min_emails_per_hour_needed,
    CASE 
        WHEN MAX(registrations) <= 2 THEN '✅ Current limit OK (2/hour)'
        WHEN MAX(registrations) <= 10 THEN '⚠️ Increase to 20/hour'
        WHEN MAX(registrations) <= 50 THEN '🔴 Increase to 100/hour'
        ELSE '🔴 Increase to 200+/hour'
    END as recommendation
FROM hourly_stats;

-- ============================================
-- 9. CHECK APP SETTINGS
-- ============================================
-- Verify the user limit setting we updated
SELECT 
    setting_key,
    setting_value,
    description,
    updated_at
FROM app_settings
WHERE setting_key = 'max_users';

-- ============================================
-- 10. QUICK HEALTH CHECK
-- ============================================
SELECT 
    'Health Check' as metric,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '1 hour') as last_hour,
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '5 minutes') as last_5_min,
    (SELECT setting_value->>'limit' FROM app_settings WHERE setting_key = 'max_users') as max_users_limit,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '5 minutes') >= 2 
        THEN '🔴 RATE LIMIT RISK'
        ELSE '✅ OK'
    END as current_status;

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================
-- 
-- 1. Run Query #2 (EMAIL RATE MONITORING) first to see hourly patterns
-- 2. Run Query #5 (CURRENT PRESSURE) to check immediate status
-- 3. Run Query #8 (RECOMMENDATIONS) to see suggested rate limits
-- 4. Run Query #10 (HEALTH CHECK) for quick overview
--
-- IMPORTANT: Your current limit is 2 emails/hour
-- Recommended: Increase to at least 20/hour for testing
--              Increase to 100+/hour for production
--
-- To increase in Supabase Dashboard:
-- Settings → Authentication → Rate Limits → "emails/h" → Change to 20 or 100
