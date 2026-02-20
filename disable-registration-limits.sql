-- ============================================================================
-- DISABLE REGISTRATION LIMITS TEMPORARILY
-- ============================================================================
-- This allows unlimited registrations until we fix the limit logic

UPDATE app_settings
SET setting_value = jsonb_set(
  setting_value,
  '{enabled}',
  'false'::jsonb
)
WHERE setting_key = 'max_users';

-- Verify the change
SELECT 
  setting_key,
  setting_value,
  setting_value->>'limit' as max_users,
  setting_value->>'enabled' as limit_enabled,
  CASE 
    WHEN (setting_value->>'enabled')::boolean = false THEN '✅ DISABLED - Unlimited registrations allowed'
    ELSE '⚠️ ENABLED - Limits active'
  END as status
FROM app_settings
WHERE setting_key = 'max_users';
