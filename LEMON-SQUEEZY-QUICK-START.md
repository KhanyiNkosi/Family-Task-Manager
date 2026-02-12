# 🚀 Lemon Squeezy Integration - Quick Start

## Files Created

### 1. Database Schema
- **`add-premium-subscription-support.sql`** - Adds license key and subscription columns to profiles table

### 2. Supabase Edge Function
- **`supabase/functions/lemonsqueezy-webhook/index.ts`** - Handles webhook events from Lemon Squeezy

### 3. API Routes
- **`app/api/check-premium/route.ts`** - API endpoint to check if user has premium access

### 4. React Components & Hooks
- **`hooks/usePremium.ts`** - React hook to check premium status
- **`components/PremiumGuard.tsx`** - Component to protect premium features
- **`app/pricing/page.tsx`** - Pricing page with checkout buttons

### 5. Documentation
- **`ENVIRONMENT-VARIABLES-GUIDE.md`** - All environment variables explained
- **`VERCEL-DEPLOYMENT-GUIDE.md`** - Complete deployment walkthrough

---

## Quick Setup Steps

### 1️⃣ Run Database Migration
```sql
-- Copy and paste content from:
add-premium-subscription-support.sql
-- into Supabase SQL Editor and run it
```

### 2️⃣ Deploy Edge Function
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase functions deploy lemonsqueezy-webhook
npx supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your-secret
```

### 3️⃣ Configure Lemon Squeezy Webhook
- **URL:** `https://your-project.supabase.co/functions/v1/lemonsqueezy-webhook`
- **Events:** order_created, subscription_created, subscription_updated, subscription_cancelled, subscription_expired

### 4️⃣ Add Environment Variables
See `ENVIRONMENT-VARIABLES-GUIDE.md` for complete list

### 5️⃣ Deploy to Vercel
Follow `VERCEL-DEPLOYMENT-GUIDE.md` for step-by-step instructions

---

## How to Use in Your Code

### Protect a Feature with Premium Guard

```tsx
import PremiumGuard from '@/components/PremiumGuard';

export default function MyFeature() {
  return (
    <PremiumGuard>
      {/* This content only shows to premium users */}
      <div>Premium Feature Content</div>
    </PremiumGuard>
  );
}
```

### Check Premium Status in Your Component

```tsx
import { usePremium } from '@/hooks/usePremium';

export default function MyComponent() {
  const { isPremium, isLoading } = usePremium();

  if (isPremium) {
    return <div>Premium features enabled!</div>;
  }

  return <div>Upgrade to premium to unlock this feature</div>;
}
```

### Show Premium Badge

```tsx
import { PremiumBadge } from '@/components/PremiumGuard';

export default function Header() {
  return (
    <div>
      <h1>My App</h1>
      <PremiumBadge /> {/* Shows "👑 Premium" if user is premium */}
    </div>
  );
}
```

---

## Testing the Integration

### 1. Test in Lemon Squeezy Test Mode
1. Enable Test Mode in Lemon Squeezy
2. Use test card: `4242 4242 4242 4242`
3. Complete checkout
4. Check Supabase logs: `npx supabase functions logs lemonsqueezy-webhook`

### 2. Verify Database Update
```sql
SELECT id, email, subscription_status, subscription_starts_at
FROM profiles
WHERE subscription_status = 'active';
```

### 3. Test Premium Access
- Login as the test user
- Visit a page with `<PremiumGuard>`
- Verify premium content is visible

---

## Common Issues

### Webhook Not Working
**Check:**
- ✅ Edge function deployed: `npx supabase functions list`
- ✅ Webhook secret is set: `npx supabase secrets list`
- ✅ Webhook URL is correct in Lemon Squeezy
- ✅ Events are selected in webhook settings

**Debug:**
```bash
# View Edge Function logs
npx supabase functions logs lemonsqueezy-webhook --follow
```

### User Not Getting Premium
**Check:**
- ✅ Email in Lemon Squeezy matches email in your app
- ✅ Webhook delivered successfully (check Lemon Squeezy dashboard)
- ✅ Database was updated (run SQL query above)

### Environment Variables Not Working
**Check:**
- ✅ Variable names are correct (case-sensitive)
- ✅ `NEXT_PUBLIC_` prefix for client-side variables
- ✅ Restarted dev server after adding variables
- ✅ Variables are set in Vercel dashboard for production

---

## Update Checkout URLs

In `app/pricing/page.tsx`, replace these URLs with your actual Lemon Squeezy checkout links:

```tsx
// Line ~135 (Monthly plan)
onClick={() => handleCheckout('https://YOUR-STORE.lemonsqueezy.com/checkout/buy/YOUR-MONTHLY-VARIANT')}

// Line ~183 (Yearly plan)
onClick={() => handleCheckout('https://YOUR-STORE.lemonsqueezy.com/checkout/buy/YOUR-YEARLY-VARIANT')}
```

Get your checkout URLs from:
Lemon Squeezy Dashboard → Products → Your Product → Checkout Links

---

## Next Steps

1. ✅ Run database migration
2. ✅ Deploy Edge Function
3. ✅ Configure Lemon Squeezy webhook
4. ✅ Add environment variables
5. ✅ Update checkout URLs in pricing page
6. ✅ Deploy to Vercel
7. ✅ Test with Lemon Squeezy test mode
8. ✅ Go live!

---

## Support

For detailed setup instructions, see:
- **`VERCEL-DEPLOYMENT-GUIDE.md`** - Complete deployment walkthrough
- **`ENVIRONMENT-VARIABLES-GUIDE.md`** - Environment variables reference

Need help? Check:
- [Lemon Squeezy Docs](https://docs.lemonsqueezy.com)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Vercel Deployment Docs](https://vercel.com/docs)
