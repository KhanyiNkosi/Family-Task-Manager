# User Registration Limits Configuration

## Overview
Implement limits to prevent spam registrations and control user growth during launch.

## Strategy 1: Database Trigger (Recommended)

### Create Registration Limit Function

```sql
-- Add to Supabase SQL Editor

-- 1. Create a settings table for global configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default registration limit
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'max_users',
  '{"limit": 1000, "enabled": true}'::jsonb,
  'Maximum number of users allowed to register'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 2. Create function to check user count before registration
CREATE OR REPLACE FUNCTION public.check_registration_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_max_users INTEGER;
  v_limit_enabled BOOLEAN;
BEGIN
  -- Get current settings
  SELECT 
    (setting_value->>'limit')::INTEGER,
    (setting_value->>'enabled')::BOOLEAN
  INTO v_max_users, v_limit_enabled
  FROM public.app_settings
  WHERE setting_key = 'max_users';
  
  -- If limits are disabled, allow registration
  IF v_limit_enabled IS FALSE THEN
    RETURN NEW;
  END IF;
  
  -- Count current users (exclude deleted/disabled)
  SELECT COUNT(*) INTO v_current_count
  FROM auth.users
  WHERE deleted_at IS NULL;
  
  -- Check if we've hit the limit
  IF v_current_count >= v_max_users THEN
    RAISE EXCEPTION 'Registration limit reached. Maximum users: %', v_max_users
      USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create trigger on auth.users (requires superuser permissions)
-- NOTE: This requires Supabase to enable for your project
-- Contact support at: https://supabase.com/dashboard/support/new

-- Alternative: Run via Supabase support ticket
-- They will execute this for you:
/*
CREATE TRIGGER check_registration_limit_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_registration_limit();
*/

-- 4. Grant permissions
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT UPDATE ON public.app_settings TO authenticated; -- Only for admin role

-- 5. Create RLS policies for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings
CREATE POLICY "Allow read access to app settings"
  ON public.app_settings FOR SELECT
  TO public
  USING (true);

-- Only admins can update
CREATE POLICY "Only admins can update settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### Management Functions

```sql
-- Function to check current user count
CREATE OR REPLACE FUNCTION public.get_user_stats()
RETURNS TABLE (
  current_users INTEGER,
  max_users INTEGER,
  limit_enabled BOOLEAN,
  remaining_slots INTEGER,
  percentage_full NUMERIC
) AS $$
DECLARE
  v_current INTEGER;
  v_max INTEGER;
  v_enabled BOOLEAN;
BEGIN
  -- Get current count
  SELECT COUNT(*) INTO v_current
  FROM auth.users
  WHERE deleted_at IS NULL;
  
  -- Get settings
  SELECT 
    (setting_value->>'limit')::INTEGER,
    (setting_value->>'enabled')::BOOLEAN
  INTO v_max, v_enabled
  FROM public.app_settings
  WHERE setting_key = 'max_users';
  
  RETURN QUERY
  SELECT 
    v_current,
    v_max,
    v_enabled,
    GREATEST(0, v_max - v_current) AS remaining_slots,
    ROUND((v_current::NUMERIC / v_max::NUMERIC) * 100, 2) AS percentage_full;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_user_stats() TO anon, authenticated;
```

### Update Registration Limit (Admin Only)

```sql
-- Function to update the limit
CREATE OR REPLACE FUNCTION public.update_registration_limit(
  new_limit INTEGER,
  enabled BOOLEAN DEFAULT true
)
RETURNS JSONB AS $$
BEGIN
  -- Only admins can run this
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Update the setting
  UPDATE public.app_settings
  SET 
    setting_value = jsonb_build_object('limit', new_limit, 'enabled', enabled),
    updated_at = NOW()
  WHERE setting_key = 'max_users';
  
  RETURN jsonb_build_object(
    'success', true,
    'new_limit', new_limit,
    'enabled', enabled
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant to authenticated users (function checks for admin role)
GRANT EXECUTE ON FUNCTION public.update_registration_limit(INTEGER, BOOLEAN) TO authenticated;
```

## Strategy 2: Application-Level Check (Immediate Implementation)

### In your signup page/API route:

```typescript
// app/lib/registration-check.ts

import { createClient } from '@supabase/supabase-js';

export async function checkRegistrationAllowed(): Promise<{
  allowed: boolean;
  message?: string;
  stats?: any;
}> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
  );

  try {
    // Get current stats
    const { data: stats, error } = await supabase
      .rpc('get_user_stats');

    if (error) {
      console.error('Error checking registration limit:', error);
      // Allow registration if we can't check (fail open)
      return { allowed: true };
    }

    if (!stats || !stats[0]) {
      return { allowed: true };
    }

    const { current_users, max_users, limit_enabled, remaining_slots } = stats[0];

    // If limits are disabled, allow
    if (!limit_enabled) {
      return { allowed: true };
    }

    // Check if we've hit the limit
    if (current_users >= max_users) {
      return {
        allowed: false,
        message: `Registration is currently limited. We've reached our capacity of ${max_users} users. Please check back later or contact support.`,
        stats: stats[0]
      };
    }

    // Return with remaining slots info
    return {
      allowed: true,
      stats: stats[0]
    };

  } catch (error) {
    console.error('Exception checking registration:', error);
    // Fail open - allow registration
    return { allowed: true };
  }
}
```

### Update SignUp Page:

```typescript
// app/signup/page.tsx (or wherever your signup is)

import { checkRegistrationAllowed } from '@/app/lib/registration-check';

export default function SignUpPage() {
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);

  useEffect(() => {
    // Check on page load
    checkRegistrationAllowed().then(result => {
      setRegistrationStatus(result);
    });
  }, []);

  const handleSignUp = async (email: string, password: string) => {
    // Check again before actual signup
    const allowed = await checkRegistrationAllowed();
    
    if (!allowed.allowed) {
      showAlert(allowed.message || 'Registration is currently closed', 'error');
      return;
    }

    // Proceed with normal signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      // Check if it's a registration limit error
      if (error.message.includes('Registration limit reached')) {
        showAlert('Registration limit reached. Please try again later.', 'error');
        return;
      }
      showAlert(error.message, 'error');
      return;
    }

    showAlert('Account created! Check your email to verify.', 'success');
  };

  // Show banner if approaching limit
  return (
    <div>
      {registrationStatus?.stats?.remaining_slots < 50 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">
            ⚠️ Limited spots remaining: Only {registrationStatus.stats.remaining_slots} registration slots available!
          </p>
        </div>
      )}
      
      {!registrationStatus?.allowed && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">
            🚫 {registrationStatus.message}
          </p>
        </div>
      )}

      {/* Your signup form */}
    </div>
  );
}
```

## Strategy 3: Waitlist System (Advanced)

### Create Waitlist Table:

```sql
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  referral_code TEXT,
  position INTEGER GENERATED ALWAYS AS (
    ROW_NUMBER() OVER (ORDER BY created_at)
  ) STORED,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'invited', 'registered')),
  invited_at TIMESTAMP WITH TIME ZONE,
  registered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous to join waitlist
CREATE POLICY "Allow anonymous to join waitlist"
  ON public.waitlist FOR INSERT
  TO anon
  WITH CHECK (true);

-- Users can see their own position
CREATE POLICY "Users can view their waitlist entry"
  ON public.waitlist FOR SELECT
  TO anon, authenticated
  USING (email = current_setting('request.jwt.claims', true)::jsonb->>'email');

-- Function to add to waitlist
CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  position INTEGER,
  message TEXT
) AS $$
DECLARE
  v_position INTEGER;
BEGIN
  -- Insert into waitlist
  INSERT INTO public.waitlist (email, full_name, referral_code)
  VALUES (p_email, p_full_name, p_referral_code)
  ON CONFLICT (email) DO NOTHING
  RETURNING position INTO v_position;
  
  IF v_position IS NULL THEN
    -- Already on waitlist
    SELECT position INTO v_position
    FROM public.waitlist
    WHERE email = p_email;
    
    RETURN QUERY SELECT false, v_position, 'Already on waitlist';
  ELSE
    RETURN QUERY SELECT true, v_position, 'Added to waitlist';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.join_waitlist(TEXT, TEXT, TEXT) TO anon, authenticated;
```

## Admin Dashboard Component

```typescript
// app/admin/registration-settings.tsx

export default function RegistrationSettings() {
  const [stats, setStats] = useState<any>(null);
  const [newLimit, setNewLimit] = useState(1000);
  const [enabled, setEnabled] = useState(true);

  const loadStats = async () => {
    const { data } = await supabase.rpc('get_user_stats');
    setStats(data?.[0]);
  };

  const updateLimit = async () => {
    const { data, error } = await supabase.rpc('update_registration_limit', {
      new_limit: newLimit,
      enabled: enabled
    });

    if (error) {
      alert('Error updating limit: ' + error.message);
      return;
    }

    alert('Registration limit updated!');
    loadStats();
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Registration Settings</h2>
      
      {stats && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">Current Users</p>
            <p className="text-3xl font-bold">{stats.current_users}</p>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-600">Remaining Slots</p>
            <p className="text-3xl font-bold">{stats.remaining_slots}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded">
            <p className="text-sm text-gray-600">Max Users</p>
            <p className="text-3xl font-bold">{stats.max_users}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-600">Capacity Used</p>
            <p className="text-3xl font-bold">{stats.percentage_full}%</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Maximum Users Limit
          </label>
          <input
            type="number"
            value={newLimit}
            onChange={(e) => setNewLimit(parseInt(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mr-2"
          />
          <label>Enable registration limits</label>
        </div>

        <button
          onClick={updateLimit}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Update Settings
        </button>
      </div>
    </div>
  );
}
```

## Implementation Checklist

- [ ] Run SQL scripts in Supabase SQL Editor
- [ ] Contact Supabase support for auth.users trigger (if using Strategy 1)
- [ ] Implement application-level check in signup flow
- [ ] Add admin dashboard for managing limits
- [ ] Set initial limit (e.g., 1000 users)
- [ ] Test registration when under limit
- [ ] Test registration when at limit
- [ ] Create waitlist page (optional)
- [ ] Set up email notifications for waitlist invites
- [ ] Monitor registration metrics
