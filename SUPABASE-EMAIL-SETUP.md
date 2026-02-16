# Supabase Email Support Configuration

## 1. Enable Email Authentication

### In Supabase Dashboard:

1. **Navigate to Authentication > Providers**
   - URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/providers`
   
2. **Configure Email Provider**
   - Enable "Email" provider
   - Turn ON "Confirm email" (recommended for production)
   - Turn OFF "Secure email change" if you want simpler email updates
   - Save changes

## 2. Configure SMTP Settings (Custom Email Domain)

### Option A: Use Supabase's Default SMTP (Development)
- Already configured out of the box
- Emails come from `noreply@mail.supabase.io`
- Limited to 4 emails per hour (free tier)

### Option B: Use Custom SMTP (Production - Recommended)

1. **Navigate to Project Settings > Auth**
   - URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/auth`

2. **Scroll to "SMTP Settings"**
   
3. **Configure Your Email Provider**
   
   **Using Gmail:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [App Password - see below]
   Sender email: your-email@gmail.com
   Sender name: FamilyTask Support
   ```
   
   **Gmail App Password Setup:**
   - Go to Google Account Settings → Security
   - Enable 2-Step Verification
   - Go to App Passwords
   - Generate new app password for "Mail"
   - Use this password in Supabase SMTP settings
   
   **Using SendGrid:**
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [Your SendGrid API Key]
   Sender email: support@familytask.com
   Sender name: FamilyTask Support
   ```
   
   **Using Resend (Recommended - Best for familytask.com):**
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Your Resend API Key]
   Sender email: support@familytask.com
   Sender name: FamilyTask Support
   ```

4. **Save SMTP Settings**

## 3. Customize Email Templates

### In Supabase Dashboard:

1. **Navigate to Authentication > Email Templates**
   - URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/templates`

2. **Customize Each Template:**

### A. Confirmation Email (Sign Up)
```html
<h2>Welcome to FamilyTask!</h2>
<p>Thanks for signing up! Click the link below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>Or copy and paste this URL: {{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>
<hr>
<p>If you didn't create a FamilyTask account, you can safely ignore this email.</p>
```

### B. Magic Link (Passwordless Login)
```html
<h2>Your FamilyTask Login Link</h2>
<p>Click the link below to sign in to your account:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to FamilyTask</a></p>
<p>Or copy and paste this URL: {{ .ConfirmationURL }}</p>
<p>This link expires in 1 hour.</p>
<hr>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### C. Password Reset
```html
<h2>Reset Your FamilyTask Password</h2>
<p>Someone requested a password reset for your account. Click the link below to create a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>Or copy and paste this URL: {{ .ConfirmationURL }}</p>
<p>This link expires in 1 hour.</p>
<hr>
<p>If you didn't request this, you can safely ignore this email. Your password won't change.</p>
```

### D. Email Change Confirmation
```html
<h2>Confirm Your New Email Address</h2>
<p>You requested to change your email address to this one. Click the link below to confirm:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm new email</a></p>
<p>Or copy and paste this URL: {{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>
<hr>
<p>If you didn't request this change, please contact support immediately.</p>
```

## 4. Configure Email Rate Limiting

### In Supabase Dashboard > Authentication > Rate Limits:

```
Email sending rate limits:
- Anonymous users: 4 emails per hour
- Authenticated users: 10 emails per hour
```

**Recommended for Production:**
- Use custom SMTP to avoid Supabase limits
- Implement application-level rate limiting
- Monitor email delivery in your SMTP provider

## 5. Set Up Support Email Forwarding

### For incoming support emails (support@familytask.com):

1. **Configure DNS MX Records** (in Vercel/domain provider):
   ```
   MX  @  10  feedback-smtp.us-east-1.amazonses.com
   ```

2. **Or use email forwarding service:**
   - **ImprovMX** (free): https://improvmx.com/
     - Add domain: familytask.com
     - Forward: support@familytask.com → your-personal-email@gmail.com
   
   - **Cloudflare Email Routing** (free):
     - Go to Email → Email Routing
     - Add route: support@familytask.com → destination email
     - Verify DNS records

3. **Or use Google Workspace** ($6/user/month):
   - Professional email: support@familytask.com
   - Full inbox management
   - Shared mailbox option

## 6. Test Email Delivery

### In your app's signup page:

1. Create a test account with a real email
2. Check if confirmation email arrives
3. Click confirmation link
4. Verify account is activated

### Test Commands (in Supabase SQL Editor):

```sql
-- Check email confirmations sent
SELECT 
  email,
  confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check for email delivery errors
SELECT *
FROM auth.audit_log_entries
WHERE event_type = 'email_send_failed'
ORDER BY created_at DESC
LIMIT 20;
```

## 7. Monitor Email Delivery

### Supabase Logs:
- Navigate to Logs > Auth Logs
- Filter by "email" events
- Check for delivery failures

### SMTP Provider Dashboards:
- **SendGrid**: Email Activity
- **Resend**: Logs & Metrics
- **Gmail**: Sent folder

## 8. Production Checklist

- [ ] Custom SMTP configured (Resend recommended)
- [ ] Email templates customized with branding
- [ ] Confirmation email enabled
- [ ] SPF/DKIM/DMARC records configured (for custom domain)
- [ ] Support email forwarding set up
- [ ] Rate limiting configured
- [ ] Test emails sent and received
- [ ] Email templates tested on mobile devices
- [ ] Spam folder checked (ensure not marked as spam)
- [ ] Unsubscribe link added to transactional emails (if required)

## 9. SPF/DKIM/DMARC Configuration (for familytask.com)

### Add these DNS records to prevent emails going to spam:

**SPF Record:**
```
TXT  @  "v=spf1 include:_spf.resend.com ~all"
```

**DKIM Record:** (Get from Resend dashboard)
```
TXT  resend._domainkey  [Resend will provide this]
```

**DMARC Record:**
```
TXT  _dmarc  "v=DMARC1; p=none; rua=mailto:dmarc@familytask.com"
```

## 10. Troubleshooting

### Emails not arriving:
1. Check Supabase logs for sending errors
2. Verify SMTP credentials
3. Check spam/junk folder
4. Test SMTP connection: `telnet smtp.resend.com 587`
5. Verify sender email is verified in SMTP provider

### Confirmation links not working:
1. Check Site URL in Supabase Auth settings
2. Verify Redirect URLs include your production domain
3. Check browser console for errors

### Rate limit errors:
1. Switch to custom SMTP (higher limits)
2. Implement exponential backoff
3. Add user-facing error messages
