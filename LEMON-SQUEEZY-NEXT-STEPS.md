# Lemon Squeezy Integration - Next Steps

## 🎉 Code Implementation Complete!

All code for Lemon Squeezy payment integration has been implemented:

### ✅ Files Created/Updated:
1. **setup-premium-features.sql** - Database schema for premium features
2. **app/api/checkout/route.ts** - Checkout session creation API
3. **app/api/webhooks/lemonsqueezy/route.ts** - Webhook handler for payment events
4. **app/pricing/page.tsx** - Updated to use new checkout API
5. **lib/premium-check.ts** - Utility functions for premium status checks
6. **env-template.txt** - Updated with Lemon Squeezy environment variables
7. **@lemonsqueezy/lemonsqueezy.js** - SDK installed ✅

---

## 📋 Setup Checklist

### Step 1: Complete Lemon Squeezy Account Setup ⏳
- [ ] Wait for account verification from Lemon Squeezy
- [ ] Log in to https://www.lemonsqueezy.com/
- [ ] Complete business information
- [ ] Set up payment details

### Step 2: Create Store
1. Go to **Settings → Stores**
2. Click **"Create Store"**
3. Fill in:
   - Store name: `FamilyTask`
   - Store URL slug: `familytask`
   - Currency: `USD`
4. Complete tax/payment settings

### Step 3: Get API Keys
1. Go to **Settings → API**
2. Click **"Create API Key"**
3. Copy the following:
   - **API Key** (keep this secret!)
   - **Store ID**

### Step 4: Create Products

#### Product 1: Premium Monthly
```
Name: FamilyTask Premium (Monthly)
Description: Unlock unlimited family members and advanced features
Price: $9.99/month
Recurring: Yes
Billing cycle: Monthly
Features:
  - Unlimited family members
  - Advanced task templates
  - Custom rewards library
  - Family analytics dashboard
  - Priority email support
  - No ads
```

#### Product 2: Premium Yearly
```
Name: FamilyTask Premium (Yearly)
Description: Save 20% with annual billing
Price: $95.99/year
Recurring: Yes
Billing cycle: Yearly
Features:
  - Everything in Monthly
  - Save $24/year (2 months free)
  - Early access to features
```

#### Product 3: Lifetime Access (Optional)
```
Name: FamilyTask Lifetime
Description: One-time payment for lifetime access
Price: $199.99
Recurring: No
Features:
  - Everything in Premium
  - Lifetime access
  - All future updates
  - Priority support forever
```

**After creating each product:**
1. Click on the product
2. Go to **Variants** tab
3. Copy the **Variant ID** (you'll need these for environment variables)

### Step 5: Configure Environment Variables

#### Local Development (.env.local)
Add these to your `.env.local` file:

```env
# Lemon Squeezy
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=your-store-id-here
LEMONSQUEEZY_API_KEY=your-api-key-here
LEMONSQUEEZY_WEBHOOK_SECRET=leave-empty-for-now

# Product Variant IDs (from Step 4)
NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID=12345
NEXT_PUBLIC_LEMONSQUEEZY_YEARLY_VARIANT_ID=12346
NEXT_PUBLIC_LEMONSQUEEZY_LIFETIME_VARIANT_ID=12347
```

#### Production (Vercel)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all the variables above
3. Set environment to: **Production**

### Step 6: Run Database Migration
1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Create new query
4. Copy/paste contents of **setup-premium-features.sql**
5. Click **Run**
6. Verify success message

### Step 7: Configure Webhook in Lemon Squeezy
1. Go to **Settings → Webhooks** in Lemon Squeezy
2. Click **"+"** to add webhook
3. Configure:
   ```
   URL: https://familytask.co/api/webhooks/lemonsqueezy
   Signing Secret: [COPY THIS - add to environment variables]
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

5. **IMPORTANT**: Copy the **Signing Secret** and add it to:
   - Local `.env.local` as `LEMONSQUEEZY_WEBHOOK_SECRET`
   - Vercel environment variables

### Step 8: Test the Integration

#### Test Checkout Flow:
1. Go to https://familytask.co/pricing
2. Click on a premium plan button
3. Should redirect to Lemon Squeezy checkout
4. Use test mode to complete a test purchase
5. Verify webhook receives the event
6. Check Supabase to confirm premium status updated

#### Test Webhook Events:
```bash
# Use Lemon Squeezy CLI for local testing
npx @lemonsqueezy/cli@latest webhooks listen --forward-to http://localhost:3000/api/webhooks/lemonsqueezy
```

### Step 9: Deploy Updated Code
If you've made local changes, deploy them:

```bash
git add .
git commit -m "Add Lemon Squeezy payment integration"
git push origin main
```

Vercel will auto-deploy.

---

## 🔧 Quick Reference

### Check Premium Status (in code)
```typescript
import { checkPremiumAccess } from '@/lib/premium-check';

const isPremium = await checkPremiumAccess();
```

### Get Subscription Details
```typescript
import { getUserSubscription } from '@/lib/premium-check';

const subscription = await getUserSubscription();
console.log(subscription.plan_type); // 'monthly' | 'yearly' | 'lifetime'
```

### Database Queries

**Check user stats:**
```sql
SELECT * FROM public.get_user_subscription('user-id-here');
```

**Check if user is premium:**
```sql
SELECT public.is_premium_user('user-id-here');
```

**View all subscriptions:**
```sql
SELECT * FROM public.subscriptions;
```

**View premium users:**
```sql
SELECT id, full_name, email, premium_status, premium_expires_at
FROM public.profiles
WHERE premium_status IN ('premium', 'lifetime');
```

---

## 🐛 Troubleshooting

### Checkout not working?
- Check that NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID is set
- Verify variant IDs are correct
- Check browser console for errors
- Ensure user is logged in

### Webhook not receiving events?
- Verify webhook URL is correct (https://familytask.co/api/webhooks/lemonsqueezy)
- Check webhook signing secret matches environment variable
- Look at Lemon Squeezy Dashboard → Webhooks → View delivery log
- Check Vercel function logs

### Premium status not updating?
- Check webhook delivery in Lemon Squeezy dashboard
- Verify user_id is being passed in custom data
- Check Supabase logs for errors
- Run: `SELECT * FROM subscriptions;` to see if record was created

### Environment variables not working?
- Restart Next.js dev server after changing .env.local
- In Vercel, redeploy after adding environment variables
- Make sure NEXT_PUBLIC_ prefix is used for client-side variables

---

## 📞 Support

If you encounter issues:
1. Check Lemon Squeezy documentation: https://docs.lemonsqueezy.com
2. Review webhook delivery logs in Lemon Squeezy dashboard
3. Check Vercel function logs for API route errors
4. Examine Supabase logs for database errors

---

## 🎯 What's Next?

After setup is complete:
1. Test thoroughly in test mode
2. Switch to live mode when ready
3. Monitor first real transactions carefully
4. Set up customer support flow for billing questions
5. Add premium feature gates throughout your app
6. Consider adding a customer portal for subscription management

---

**Current Status:**
- ✅ All code implemented
- ⏳ Awaiting Lemon Squeezy account verification
- ⏳ Needs environment variable configuration
- ⏳ Needs database migration
- ⏳ Needs webhook configuration
