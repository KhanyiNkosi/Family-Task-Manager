# Environment Variables Setup Guide

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Supabase Configuration
```env
# Public Supabase URL (visible to client)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Public Anon Key (visible to client, safe for browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Service Role Key (SERVER-SIDE ONLY - never expose to client!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Lemon Squeezy Configuration
```env
# Lemon Squeezy API Key (SERVER-SIDE ONLY)
LEMONSQUEEZY_API_KEY=your-lemonsqueezy-api-key

# Lemon Squeezy Webhook Secret (for signature verification)
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-signing-secret

# Lemon Squeezy Store ID
LEMONSQUEEZY_STORE_ID=your-store-id

# Product/Variant IDs for subscription plans
LEMONSQUEEZY_MONTHLY_VARIANT_ID=your-monthly-variant-id
LEMONSQUEEZY_YEARLY_VARIANT_ID=your-yearly-variant-id
```

---

## Where to Find These Values

### 1. Supabase Values

Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → Settings → API

- **NEXT_PUBLIC_SUPABASE_URL**: Project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: `anon` `public` key
- **SUPABASE_SERVICE_ROLE_KEY**: `service_role` `secret` key ⚠️ Keep this secret!

### 2. Lemon Squeezy Values

Go to [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com)

**API Key:**
- Settings → API → Create new API key
- Copy the key immediately (only shown once)

**Webhook Secret:**
- Settings → Webhooks → Create new webhook
- URL: `https://your-project.supabase.co/functions/v1/lemonsqueezy-webhook`
- Events to subscribe to:
  - ✅ `order_created`
  - ✅ `subscription_created`
  - ✅ `subscription_updated`
  - ✅ `subscription_cancelled`
  - ✅ `subscription_expired`
- Copy the **Signing Secret**

**Store ID & Product IDs:**
- Settings → Stores → Copy Store ID
- Products → Your subscription product → Copy Product ID
- Variants → Copy each variant ID (monthly, yearly, etc.)

---

## Vercel Environment Variables Setup

When deploying to Vercel, add these environment variables:

### In Vercel Dashboard:

1. Go to your project → Settings → Environment Variables
2. Add each variable one by one:

**Production + Preview + Development:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Production + Preview ONLY (secrets):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_MONTHLY_VARIANT_ID`
- `LEMONSQUEEZY_YEARLY_VARIANT_ID`

---

## Supabase Edge Function Environment Variables

Configure secrets for your Edge Function:

```bash
# Set webhook secret (run from project root)
npx supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret

# Verify it's set
npx supabase secrets list
```

The Edge Function automatically has access to:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Security Best Practices

✅ **DO:**
- Keep `.env.local` in `.gitignore`
- Use `NEXT_PUBLIC_` prefix ONLY for client-safe values
- Store secrets in Vercel Environment Variables
- Use different keys for development and production

❌ **DON'T:**
- Commit `.env.local` to git
- Expose `service_role` key to client
- Share API keys in screenshots or logs
- Use production keys in development

---

## Testing Your Setup

1. **Test locally:**
   ```bash
   npm run dev
   # Check console for any missing env var errors
   ```

2. **Test Supabase connection:**
   - Try logging in
   - Check if data loads from database

3. **Test Edge Function locally:**
   ```bash
   npx supabase functions serve lemonsqueezy-webhook
   # Send test webhook with curl or Postman
   ```

4. **Test on Vercel:**
   - Deploy preview branch
   - Check Vercel logs for any env var issues
   - Test webhook from Lemon Squeezy dashboard

---

## Troubleshooting

**"Missing environment variable" error:**
- Check variable name spelling (case-sensitive)
- Verify it's in `.env.local` for local dev
- Verify it's in Vercel dashboard for production
- Restart dev server after adding new variables

**Webhook signature verification fails:**
- Verify `LEMONSQUEEZY_WEBHOOK_SECRET` is set correctly in Supabase secrets
- Check webhook is configured correctly in Lemon Squeezy
- Verify webhook URL is correct

**Database permission errors:**
- Make sure you ran `add-premium-subscription-support.sql`
- Check RLS policies allow the operations
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
