# Resend SMTP Configuration for Supabase

This guide will help you configure Resend as your custom SMTP provider to bypass Supabase's 2 emails/hour limit.

## ✅ Prerequisites

- [x] Resend account created
- [x] API key generated: "Family-task" (Full access)
- [ ] Domain verified in Resend (required before emails work)
- [ ] Supabase SMTP configured

---

## 🔑 Step 1: Get Your Resend API Key

You already have this! Your API key is named **"Family-task"** with full access.

**To view/copy your API key:**
1. Go to https://resend.com/api-keys
2. Click on "Family-task" or create a new one if needed
3. Copy the API key (format: `re_xxxxxxxxxxxxx`)

**Keep this key secure** - you'll need it for Supabase configuration.

---

## 🌐 Step 2: Verify Your Domain in Resend

Before emails can be sent, you must verify your domain ownership.

### Option A: Use Your Custom Domain (Recommended for Production)

1. **Go to Resend Domains:**
   - Navigate to https://resend.com/domains
   - Click **"Add Domain"**

2. **Enter your domain:**
   ```
   familytask.co
   ```
   (or whatever your production domain is)

3. **Add DNS Records:**
   
   Resend will provide records like these:
   
   ```dns
   Type: TXT
   Name: _resend.familytask.co
   Value: resend_verify_xxxxxxxxxxxxx
   TTL: 3600
   
   Type: TXT  
   Name: resend._domainkey.familytask.co
   Value: p=MIGfMA0GCSqGSIb3....(long string)
   TTL: 3600
   ```

4. **Add to your domain registrar:**
   - Log into your domain provider (GoDaddy, Namecheap, Cloudflare, etc.)
   - Go to DNS Management
   - Add the TXT records exactly as shown
   - Wait 5-30 minutes for DNS propagation

5. **Verify in Resend:**
   - Return to Resend Domains page
   - Click "Verify" button
   - Status should change to ✅ **Verified**

### Option B: Use Resend's Test Domain (Testing Only)

If you want to test immediately without domain setup:

**Resend Test Domain:** `onboarding.resend.dev`
- **Sender email:** `delivered@resend.dev`
- **Limitation:** 1 email per day maximum
- **Use for:** Quick testing only, NOT production

---

## ⚙️ Step 3: Configure Custom SMTP in Supabase

1. **Open Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project: **Family Task Manager**

2. **Navigate to Authentication Settings:**
   - Click **Settings** (gear icon, bottom left)
   - Click **Authentication**
   - Scroll down to **SMTP Settings** section

3. **Enable Custom SMTP:**
   - Toggle **"Enable Custom SMTP"** to ON

4. **Enter SMTP Configuration:**

   ### For Your Verified Domain:
   ```
   Sender email:         noreply@familytask.co
   Sender name:          FamilyTask
   Host:                 smtp.resend.com
   Port number:          587
   Username:             resend
   Password:             re_xxxxxxxxxxxxx  (Your API key)
   ```

   ### For Testing (Resend Test Domain):
   ```
   Sender email:         delivered@resend.dev
   Sender name:          FamilyTask
   Host:                 smtp.resend.com
   Port number:          587
   Username:             resend
   Password:             re_xxxxxxxxxxxxx  (Your API key)
   ```

5. **Important Configuration Notes:**
   - **Username:** Always use `resend` (lowercase, never your email)
   - **Password:** Your Resend API key (starts with `re_`)
   - **Port:** 587 for TLS (recommended) or 465 for SSL
   - **Sender email:** Must use your verified domain

6. **Click "Save"**

---

## 📧 Step 4: Update Email Templates (Optional)

Update your Supabase email templates to use your branded sender:

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Email Templates**

2. **Update each template:**
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

3. **Change sender details:**
   ```
   From: noreply@familytask.co
   Reply to: support@familytask.co (optional)
   Subject: [Customize as needed]
   ```

---

## 🧪 Step 5: Test Your Configuration

### Test Registration:

1. **Go to your app's registration page:**
   ```
   https://family-task-manager.vercel.app/register
   ```

2. **Register a new test user:**
   - Use a real email you can access
   - Complete the registration form
   - Submit

3. **Check for confirmation email:**
   - Should arrive within seconds
   - Check spam folder if not in inbox
   - Email should come from your configured sender

### Check Resend Logs:

1. **Go to Resend Dashboard:**
   - Navigate to https://resend.com/emails

2. **View sent emails:**
   - You should see the confirmation email
   - Status should be "Delivered"
   - Click on email to see details

### Monitor in Supabase:

1. **Run monitoring query:**
   - Open Supabase SQL Editor
   - Run queries from `monitor-rate-limits.sql`
   - Check recent registration attempts

---

## 📊 Rate Limits Comparison

| Provider | Previous (Supabase) | New (Resend) |
|----------|---------------------|--------------|
| Emails/Hour | 2 | Unlimited |
| Emails/Day | 48 | 100 (free) / 1,600+ (paid) |
| Emails/Month | ~1,400 | 3,000 (free) / 50,000+ (paid) |
| Cost | Included | Free / $20/mo |

**Your new capacity:**
- ✅ **100 registrations/day** (free tier)
- ✅ **No hourly restrictions**
- ✅ **Email analytics** in Resend dashboard
- ✅ **Better deliverability** with verified domain

---

## 🔍 Troubleshooting

### Problem: Emails not sending

**Check Supabase Logs:**
1. Supabase Dashboard → Logs → Auth Logs
2. Look for SMTP errors

**Check Resend Dashboard:**
1. Go to https://resend.com/emails
2. Check if emails appear (even if failed)
3. Click on email to see error details

**Common Issues:**

1. **"Domain not verified"**
   - Solution: Complete Step 2 (domain verification)
   - Check DNS records are correct
   - Wait 30 minutes for propagation

2. **"Authentication failed"**
   - Solution: Double-check API key is correct
   - Ensure username is `resend` (not your email)
   - Try generating a new API key

3. **"Sender email rejected"**
   - Solution: Sender email must match verified domain
   - Can't use `@gmail.com`, `@yahoo.com`, etc.
   - Must use your verified domain or `delivered@resend.dev` for testing

4. **Rate limit still hit**
   - Solution: Check you saved SMTP settings in Supabase
   - Verify "Enable Custom SMTP" toggle is ON
   - Test with a different email address

### Problem: Emails going to spam

**Improve Deliverability:**

1. **Add SPF Record:**
   ```dns
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.resend.com ~all
   ```

2. **Add DMARC Record:**
   ```dns
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
   ```

3. **Warm up your domain:**
   - Start with 10-20 emails/day
   - Gradually increase volume
   - Monitor bounce rates in Resend

---

## 📋 Quick Reference

### Resend SMTP Settings:
```
Host:     smtp.resend.com
Port:     587 (TLS) or 465 (SSL)
Username: resend
Password: [Your API Key]
From:     [Your verified domain email]
```

### Useful Links:
- Resend Dashboard: https://resend.com/dashboard
- API Keys: https://resend.com/api-keys
- Domains: https://resend.com/domains
- Email Logs: https://resend.com/emails
- Resend Docs: https://resend.com/docs/send-with-smtp

### Support:
- Resend Support: https://resend.com/support
- Resend Discord: https://discord.gg/resend

---

## ✅ Configuration Checklist

- [ ] Resend API key created and copied
- [ ] Domain added to Resend
- [ ] DNS records added to domain registrar
- [ ] Domain verified in Resend (green checkmark)
- [ ] Custom SMTP enabled in Supabase
- [ ] SMTP credentials entered in Supabase
- [ ] SMTP settings saved in Supabase
- [ ] Test registration completed successfully
- [ ] Confirmation email received
- [ ] Email appears in Resend logs as "Delivered"
- [ ] SPF/DMARC records added (optional but recommended)

---

## 🚀 Next Steps After Setup

1. **Test thoroughly:**
   - Register multiple test accounts
   - Test password reset flow
   - Test magic link login (if enabled)

2. **Monitor performance:**
   - Check Resend dashboard daily
   - Watch for bounces/complaints
   - Use `monitor-rate-limits.sql` queries

3. **Upgrade if needed:**
   - Free tier: 3,000 emails/month
   - If you exceed this, upgrade to Pro ($20/mo for 50,000 emails)

4. **Set up webhooks (optional):**
   - Get real-time delivery notifications
   - Track bounces and complaints
   - Update user profiles based on email events

---

## 💡 Pro Tips

1. **Use subdomains for different purposes:**
   - `noreply@familytask.co` - System emails
   - `support@familytask.co` - Customer support
   - `hello@familytask.co` - Marketing

2. **Set up email templates in Resend:**
   - Use Resend's template feature
   - Maintain consistent branding
   - A/B test subject lines

3. **Monitor deliverability metrics:**
   - Keep bounce rate < 2%
   - Keep complaint rate < 0.1%
   - Maintain good sender reputation

4. **Respect user preferences:**
   - Always include unsubscribe links
   - Honor opt-out requests immediately
   - Don't send marketing emails without consent

---

**Need help?** Open an issue or check the troubleshooting section above.

**Configuration complete?** Your app can now handle 100+ registrations per day! 🎉
