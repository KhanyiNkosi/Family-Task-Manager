# 🚀 Vercel Deployment Guide with Lemon Squeezy Integration

Complete step-by-step guide to deploy your Family Task Manager app to Vercel with premium subscription support.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] GitHub account
- [ ] Vercel account (sign up at [vercel.com](https://vercel.com))
- [ ] Supabase project fully configured
- [ ] Lemon Squeezy account and store setup
- [ ] All database migrations run in Supabase

---

## 🗄️ Step 1: Setup Database (Supabase)

### 1.1 Run Database Migrations

Run these SQL files in your Supabase SQL Editor:

```sql
-- 1. Add premium subscription columns
-- File: add-premium-subscription-support.sql
-- This adds license_key, subscription_status, etc.
```

Copy and paste the entire content of `add-premium-subscription-support.sql` into Supabase SQL Editor and run it.

### 1.2 Deploy Edge Function

```bash
# Login to Supabase CLI
npx supabase login

# Link your project (get reference ID from Supabase dashboard)
npx supabase link --project-ref your-project-ref

# Deploy the webhook function
npx supabase functions deploy lemonsqueezy-webhook

# Set webhook secret
npx supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret

# Verify deployment
npx supabase functions list
```

Your Edge Function URL will be:
```
https://your-project.supabase.co/functions/v1/lemonsqueezy-webhook
```

---

## 🍋 Step 2: Configure Lemon Squeezy

### 2.1 Create Subscription Product

1. Go to [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com) → Products
2. Click **"Create Product"**
3. Configure:
   - **Type:** Subscription
   - **Name:** "Family Task Manager Premium"
   - **Description:** Your premium features description
   - **Pricing:** Set your monthly/yearly prices
   - **License Keys:** ✅ Enable if you want license key generation

### 2.2 Create Product Variants

Create variants for different billing periods:

- **Monthly Plan:** $X.XX/month
- **Yearly Plan:** $XX.XX/year (with discount)

Copy each **Variant ID** - you'll need these for environment variables.

### 2.3 Configure Webhook

1. Settings → Webhooks → **"Create Webhook"**
2. Configure:
   - **URL:** `https://your-project.supabase.co/functions/v1/lemonsqueezy-webhook`
   - **Events to subscribe:**
     - ✅ `order_created`
     - ✅ `subscription_created`
     - ✅ `subscription_updated`
     - ✅ `subscription_cancelled`
     - ✅ `subscription_expired`
3. **Copy the Signing Secret** immediately

### 2.4 Get API Key

1. Settings → API → **"Create API Key"**
2. Name it "Production API Key"
3. **Copy the key immediately** (only shown once)

---

## 🔐 Step 3: Prepare Environment Variables

Create a list of all your environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (secret!)

# Lemon Squeezy
LEMONSQUEEZY_API_KEY=your-api-key (secret!)
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret (secret!)
LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_MONTHLY_VARIANT_ID=variant-id
LEMONSQUEEZY_YEARLY_VARIANT_ID=variant-id
```

**Where to find these:** See `ENVIRONMENT-VARIABLES-GUIDE.md`

---

## 🚀 Step 4: Deploy to Vercel

### 4.1 Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Add premium subscription support"

# Create GitHub repository and push
# (Follow GitHub's instructions for creating new repository)
git remote add origin https://github.com/yourusername/your-repo.git
git branch -M main
git push -u origin main
```

### 4.2 Import Project to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Click **"Import"**

### 4.3 Configure Project Settings

**Framework Preset:** Next.js
**Root Directory:** `./` (leave as is)
**Build Command:** `npm run build` (default)
**Output Directory:** `.next` (default)

### 4.4 Add Environment Variables

In the Vercel import screen, add your environment variables:

**Click "Environment Variables" to expand**

For each variable, specify which environments it should be available in:
- ✅ Production
- ✅ Preview (for testing branches)
- ⬜ Development (use `.env.local` instead)

**Public variables** (safe for client):
```
NEXT_PUBLIC_SUPABASE_URL = your-value
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-value
```

**Secret variables** (server-only):
```
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
LEMONSQUEEZY_API_KEY = your-api-key
LEMONSQUEEZY_WEBHOOK_SECRET = your-webhook-secret
LEMONSQUEEZY_STORE_ID = your-store-id
LEMONSQUEEZY_MONTHLY_VARIANT_ID = your-variant-id
LEMONSQUEEZY_YEARLY_VARIANT_ID = your-variant-id
```

### 4.5 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Click **"Visit"** to see your live app!

Your app will be available at: `https://your-project.vercel.app`

---

## ✅ Step 5: Post-Deployment Testing

### 5.1 Test Basic Functionality

1. Visit your deployed app
2. Test signup/login
3. Create a family and add tasks
4. Verify all pages load correctly

### 5.2 Test Webhook Integration

1. Go to Lemon Squeezy Dashboard → Webhooks
2. Find your webhook
3. Click **"Send Test Event"**
4. Select `subscription_created` event
5. Check Supabase Edge Function logs:
   ```bash
   npx supabase functions logs lemonsqueezy-webhook
   ```

### 5.3 Test Premium Flow (Sandbox/Test Mode)

1. Create a test checkout link in Lemon Squeezy
2. Enable **Test Mode**
3. Use test card: `4242 4242 4242 4242`
4. Complete purchase
5. Verify webhook received (check logs)
6. Check user's profile in Supabase:
   ```sql
   SELECT id, email, subscription_status, license_key
   FROM profiles
   WHERE email = 'test@example.com';
   ```

---

## 🔧 Step 6: Custom Domain (Optional)

### 6.1 Add Domain in Vercel

1. Vercel Dashboard → Your Project → Settings → Domains
2. Enter your domain: `yourdomain.com`
3. Follow DNS configuration instructions

### 6.2 Update Lemon Squeezy URLs

Update your checkout links and product URLs to use your custom domain.

### 6.3 Update Supabase Redirect URLs

1. Supabase Dashboard → Authentication → URL Configuration
2. Add your custom domain to:
   - Redirect URLs
   - Site URL

---

## 📊 Step 7: Monitoring and Maintenance

### Monitor Vercel Deployments

- **Vercel Dashboard:** Check deployment status, logs, and analytics
- **Real-time logs:** Deployments tab → Click deployment → View logs

### Monitor Supabase

- **Database:** Query Editor to check data
- **Edge Functions:** Check logs for webhook errors
- **Auth:** Monitor user signups

### Monitor Lemon Squeezy

- **Dashboard:** Track subscriptions, revenue
- **Webhooks:** Check delivery status and errors
- **Customers:** Manage subscriptions

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error: Missing environment variables**
- Check all `NEXT_PUBLIC_*` variables are set
- Redeploy after adding variables

**Error: Type errors during build**
```bash
# Run locally to see TypeScript errors
npm run build
```

### Webhook Not Working

**Check Edge Function logs:**
```bash
npx supabase functions logs lemonsqueezy-webhook --follow
```

**Common issues:**
- ❌ Webhook secret mismatch
- ❌ Edge function not deployed
- ❌ Wrong webhook URL in Lemon Squeezy

**Test webhook manually:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/lemonsqueezy-webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: your-signature" \
  -d '{"meta":{"event_name":"test"},"data":{}}'
```

### Users Not Getting Premium Access

1. **Check webhook delivery** in Lemon Squeezy dashboard
2. **Check Edge Function logs** for errors
3. **Verify database update:**
   ```sql
   SELECT * FROM profiles WHERE subscription_status = 'active';
   ```
4. **Check email match:** Ensure user's email in app matches Lemon Squeezy order email

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push origin main

# Vercel will automatically deploy (1-3 minutes)
```

**Preview Deployments:**
- Create a branch: `git checkout -b feature-name`
- Push branch: `git push origin feature-name`
- Vercel creates preview URL automatically
- Test before merging to main

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Lemon Squeezy Webhooks Guide](https://docs.lemonsqueezy.com/guides/webhooks)

---

## 🎉 You're Done!

Your Family Task Manager is now live with premium subscription support!

**Next steps:**
- Create a pricing page: `/app/pricing/page.tsx`
- Add checkout buttons using Lemon Squeezy Checkout Links
- Market your app and get users!

**Need help?** Check the troubleshooting section or refer to the documentation links above.
