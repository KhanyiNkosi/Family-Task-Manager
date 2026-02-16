# Lemon Squeezy Payment Integration Guide

## Overview
Integrate Lemon Squeezy for premium subscriptions, one-time purchases, and monetization.

## 1. Lemon Squeezy Account Setup

### Create Account
1. Go to https://www.lemonsqueezy.com/
2. Sign up for an account
3. Verify your email
4. Complete business information

### Create Store
1. Navigate to Settings → Stores
2. Click "Create Store"
3. Fill in:
   - Store name: "FamilyTask"
   - Store URL slug: "familytask"
   - Currency: USD (or your preferred currency)
4. Complete tax/payment settings

### Get API Keys
1. Navigate to Settings → API
2. Create new API key
3. Copy and save:
   - `API Key` (secret - for server-side)
   - `Store ID`
4. Never expose API key in client-side code!

## 2. Environment Variables

Add to your `.env.local`:

```env
# Lemon Squeezy
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret

# Lemon Squeezy URLs
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=https://familytask.lemonsqueezy.com/checkout
```

Add to Vercel Environment Variables:
- Production environment
- Same variables as above

## 3. Create Products in Lemon Squeezy

### Product 1: Premium Monthly Subscription

1. Navigate to Products → New Product
2. Fill in details:
   ```
   Name: FamilyTask Premium (Monthly)
   Description: Unlock unlimited family members, advanced features, and priority support
   Price: $9.99/month
   Recurring: Yes
   Billing cycle: Monthly
   ```

3. Add features:
   - ✅ Unlimited family members
   - ✅ Advanced task templates
   - ✅ Priority email support
   - ✅ Custom rewards library
   - ✅ Family analytics dashboard
   - ✅ No ads
   - ✅ Early access to new features

4. Copy the Product ID and Variant ID

### Product 2: Premium Yearly Subscription

```
Name: FamilyTask Premium (Yearly)
Description: Save 20% with annual billing
Price: $95.99/year ($8.00/month)
Recurring: Yes
Billing cycle: Yearly
```

### Product 3: Lifetime Access (One-time)

```
Name: FamilyTask Lifetime
Description: One-time payment for lifetime access
Price: $199.99
Recurring: No
```

## 4. Database Schema for Premium Features

```sql
-- Add premium status to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS premium_status TEXT DEFAULT 'free' CHECK (premium_status IN ('free', 'premium', 'lifetime')),
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id TEXT,
ADD COLUMN IF NOT EXISTS lemonsqueezy_subscription_id TEXT;

-- Create subscriptions tracking table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lemon Squeezy IDs
  lemonsqueezy_subscription_id TEXT UNIQUE,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_order_id TEXT,
  lemonsqueezy_product_id TEXT,
  lemonsqueezy_variant_id TEXT,
  
  -- Status and billing
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'paused')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
  billing_amount DECIMAL(10, 2),
  billing_currency TEXT DEFAULT 'USD',
  
  -- Timestamps
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_lemonsqueezy_id ON public.subscriptions(lemonsqueezy_subscription_id);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create function to check premium status
CREATE OR REPLACE FUNCTION public.is_premium_user(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_premium BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.profiles p
    WHERE p.id = p_user_id
    AND (
      -- Has active premium status
      p.premium_status IN ('premium', 'lifetime')
      -- And subscription hasn't expired (or is lifetime)
      AND (
        p.premium_status = 'lifetime'
        OR p.premium_expires_at > NOW()
      )
    )
  ) INTO v_is_premium;
  
  RETURN v_is_premium;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_premium_user(UUID) TO authenticated;
```

## 5. Install Lemon Squeezy SDK

```bash
npm install @lemonsqueezy/lemonsqueezy.js
```

## 6. Create API Routes

### Checkout Session Creation

```typescript
// app/api/checkout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Configure Lemon Squeezy
lemonSqueezySetup({
  apiKey: process.env.LEMONSQUEEZY_API_KEY!,
  onError: (error) => console.error('Lemon Squeezy Error:', error)
});

export async function POST(request: NextRequest) {
  try {
    const { variantId } = await request.json();
    
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Create checkout session
    const checkout = await createCheckout(
      process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID!,
      variantId,
      {
        checkoutData: {
          email: user.email || profile?.email,
          name: profile?.full_name,
          custom: {
            user_id: user.id
          }
        },
        checkoutOptions: {
          embed: false,
          media: true,
          logo: true,
          desc: true,
          discount: true,
          dark: false,
          subscriptionPreview: true
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        preview: false,
        testMode: process.env.NODE_ENV === 'development'
      }
    );

    return NextResponse.json({ 
      checkoutUrl: checkout.data.data.attributes.url 
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
```

### Webhook Handler

```typescript
// app/api/webhooks/lemonsqueezy/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Use service role for direct database access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySignature(payload: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET!);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');

    if (!signature || !verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventName = event.meta.event_name;
    const data = event.data;

    console.log('Lemon Squeezy webhook:', eventName);

    // Get user_id from custom data
    const userId = data.attributes.first_order_item?.product_id || 
                   event.meta.custom_data?.user_id;

    if (!userId) {
      console.error('No user_id in webhook data');
      return NextResponse.json({ error: 'No user_id' }, { status: 400 });
    }

    switch (eventName) {
      case 'order_created':
        await handleOrderCreated(userId, data);
        break;
      
      case 'subscription_created':
        await handleSubscriptionCreated(userId, data);
        break;
      
      case 'subscription_updated':
        await handleSubscriptionUpdated(userId, data);
        break;
      
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(userId, data);
        break;
      
      case 'subscription_resumed':
        await handleSubscriptionResumed(userId, data);
        break;
      
      case 'subscription_expired':
        await handleSubscriptionExpired(userId, data);
        break;
      
      case 'subscription_payment_success':
        await handlePaymentSuccess(userId, data);
        break;
      
      case 'subscription_payment_failed':
        await handlePaymentFailed(userId, data);
        break;
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function handleOrderCreated(userId: string, data: any) {
  console.log('Order created for user:', userId);
  
  // Check if this is a lifetime purchase
  const productName = data.attributes.first_order_item.product_name;
  
  if (productName.includes('Lifetime')) {
    await supabase
      .from('profiles')
      .update({
        premium_status: 'lifetime',
        premium_expires_at: null,
        lemonsqueezy_customer_id: data.attributes.customer_id
      })
      .eq('id', userId);
  }
}

async function handleSubscriptionCreated(userId: string, data: any) {
  const attrs = data.attributes;
  
  // Determine plan type
  const planType = attrs.product_name.includes('Yearly') ? 'yearly' : 'monthly';
  
  // Insert subscription record
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      lemonsqueezy_subscription_id: data.id,
      lemonsqueezy_customer_id: attrs.customer_id,
      lemonsqueezy_order_id: attrs.order_id,
      lemonsqueezy_product_id: attrs.product_id,
      lemonsqueezy_variant_id: attrs.variant_id,
      status: 'active',
      plan_type: planType,
      billing_amount: parseFloat(attrs.subtotal),
      billing_currency: attrs.currency,
      current_period_start: attrs.renews_at,
      current_period_end: attrs.ends_at,
      trial_ends_at: attrs.trial_ends_at
    });
  
  // Update user profile
  await supabase
    .from('profiles')
    .update({
      premium_status: 'premium',
      premium_expires_at: attrs.renews_at,
      lemonsqueezy_customer_id: attrs.customer_id,
      lemonsqueezy_subscription_id: data.id
    })
    .eq('id', userId);
}

async function handleSubscriptionUpdated(userId: string, data: any) {
  const attrs = data.attributes;
  
  await supabase
    .from('subscriptions')
    .update({
      status: attrs.status,
      current_period_end: attrs.renews_at,
      updated_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', data.id);
  
  await supabase
    .from('profiles')
    .update({
      premium_expires_at: attrs.renews_at
    })
    .eq('id', userId);
}

async function handleSubscriptionCancelled(userId: string, data: any) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('lemonsqueezy_subscription_id', data.id);
  
  // Don't immediately revoke premium - wait until period ends
}

async function handleSubscriptionExpired(userId: string, data: any) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'expired'
    })
    .eq('lemonsqueezy_subscription_id', data.id);
  
  await supabase
    .from('profiles')
    .update({
      premium_status: 'free',
      premium_expires_at: null
    })
    .eq('id', userId);
}

async function handlePaymentSuccess(userId: string, data: any) {
  console.log('Payment successful for user:', userId);
  // Extend subscription period
  await handleSubscriptionUpdated(userId, data);
}

async function handlePaymentFailed(userId: string, data: any) {
  console.log('Payment failed for user:', userId);
  
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due'
    })
    .eq('lemonsqueezy_subscription_id', data.id);
  
  // Send notification to user
  // TODO: Implement email notification
}
```

## 7. Frontend Components

### Pricing Page

```typescript
// app/pricing/page.tsx

'use client';

import { useState } from 'react';
import { createClientSupabaseClient } from '@/lib/supabaseClient';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Up to 5 family members',
      'Basic task management',
      'Basic rewards system',
      'Email support'
    ],
    variantId: null,
    cta: 'Current Plan'
  },
  {
    name: 'Premium Monthly',
    price: '$9.99',
    period: 'per month',
    features: [
      'Unlimited family members',
      'Advanced task templates',
      'Custom rewards library',
      'Family analytics dashboard',
      'Priority email support',
      'No ads',
      'Early access to features'
    ],
    variantId: 'YOUR_MONTHLY_VARIANT_ID',
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Premium Yearly',
    price: '$95.99',
    period: 'per year',
    badge: 'Save 20%',
    features: [
      'Everything in Monthly',
      'Save $24/year',
      '2 months free'
    ],
    variantId: 'YOUR_YEARLY_VARIANT_ID',
    cta: 'Start Free Trial'
  },
  {
    name: 'Lifetime',
    price: '$199.99',
    period: 'one-time',
    badge: 'Best Value',
    features: [
      'Everything in Premium',
      'Lifetime access',
      'All future updates',
      'Priority support forever'
    ],
    variantId: 'YOUR_LIFETIME_VARIANT_ID',
    cta: 'Buy Lifetime'
  }
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  
  const handleCheckout = async (variantId: string) => {
    if (!variantId) return;
    
    setLoading(variantId);
    
    try {
      const supabase = createClientSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login?redirect=/pricing';
        return;
      }
      
      // Create checkout session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId })
      });
      
      const { checkoutUrl, error } = await response.json();
      
      if (error) {
        alert('Error: ' + error);
        return;
      }
      
      // Redirect to Lemon Squeezy checkout
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start free, upgrade anytime. No credit card required.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`
                relative bg-white rounded-2xl p-8 shadow-lg
                ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}
              `}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {plan.badge}
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {plan.period}
                  </span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => plan.variantId && handleCheckout(plan.variantId)}
                disabled={!plan.variantId || loading === plan.variantId}
                className={`
                  w-full py-3 rounded-lg font-semibold transition-colors
                  ${plan.popular 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }
                  ${!plan.variantId ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {loading === plan.variantId ? 'Loading...' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## 8. Configure Webhook in Lemon Squeezy

1. Go to Settings → Webhooks
2. Click "+" to add webhook
3. Configure:
   ```
   URL: https://familytask.com/api/webhooks/lemonsqueezy
   Signing Secret: [Copy this - add to .env]
   ```
4. Select events to send:
   - ✅ order_created
   - ✅ subscription_created
   - ✅ subscription_updated
   - ✅ subscription_cancelled
   - ✅ subscription_resumed
   - ✅ subscription_expired
   - ✅ subscription_payment_success
   - ✅ subscription_payment_failed

## 9. Test in Development

```bash
# Use Lemon Squeezy CLI for local testing
npx @lemonsqueezy/cli@latest webhooks listen --forward-to http://localhost:3000/api/webhooks/lemonsqueezy
```

## 10. Premium Feature Checks

```typescript
// app/lib/premium-check.ts

import { createClientSupabaseClient } from '@/lib/supabaseClient';

export async function checkPremiumAccess(): Promise<boolean> {
  const supabase = createClientSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;
  
  const { data } = await supabase.rpc('is_premium_user', {
    p_user_id: user.id
  });
  
  return data || false;
}

// Use in components
export function usePremium() {
  const [isPremium, setIsPremium] = useState(false);
  
  useEffect(() => {
    checkPremiumAccess().then(setIsPremium);
  }, []);
  
  return isPremium;
}
```

## Implementation Checklist

- [ ] Create Lemon Squeezy account
- [ ] Set up store and products
- [ ] Copy API keys to environment variables
- [ ] Run database migrations (SQL from Step 4)
- [ ] Install Lemon Squeezy SDK
- [ ] Create API routes (checkout, webhook)
- [ ] Build pricing page
- [ ] Configure webhook in Lemon Squeezy dashboard
- [ ] Test checkout flow
- [ ] Test webhook events
- [ ] Add premium feature gates
- [ ] Test subscription cancellation
- [ ] Set up customer portal link
- [ ] Configure tax settings
- [ ] Test refund flow

## Production Notes

- Test mode first, then switch to live mode
- Monitor webhook delivery in Lemon Squeezy dashboard
- Set up proper error logging
- Add email notifications for payment events
- Implement grace period for failed payments
- Add customer portal access for users to manage subscriptions
- Set up analytics tracking for conversions
