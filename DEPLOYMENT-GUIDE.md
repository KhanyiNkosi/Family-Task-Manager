# Deployment Guide - FamilyTask

## ✅ Build Status
Production build completed successfully!  
**Route Summary:** 53 pages generated, production optimized.

---

## 1. Deploy to Vercel (Recommended)

### Option A: Deploy via Vercel CLI (Fastest)

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (first time - will create new project)
vercel --prod

# Follow prompts:
# - Link to existing project? No
# - Project name: familytask
# - Deploy to: Production
```

### Option B: Deploy via GitHub (Automatic Deployments)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Production ready - Goals auto-update + Logout fixes"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository: `Family-Task-Manager-New`
   - Configure:
     ```
     Framework Preset: Next.js
     Root Directory: ./
     Build Command: npm run build
     Output Directory: .next
     ```

3. **Add Environment Variables in Vercel:**
   - Project Settings → Environment Variables
   - Add ALL variables from your `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=https://familytask.com
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Get deployment URL (e.g., `familytask.vercel.app`)

---

## 2. Configure Custom Domain (familytask.com)

### In Vercel Dashboard:

1. **Go to Project Settings → Domains**
2. **Add Domain:**
   ```
   familytask.com
   www.familytask.com
   ```

3. **Update DNS at Vercel (as done before):**
   - Wait for nameserver propagation (2-48 hours)
   - Vercel will automatically provision SSL certificate

### Check DNS Status:
```bash
# Check nameserver propagation
nslookup -type=NS familytask.com

# Should show:
# ns1.vercel-dns.com
# ns2.vercel-dns.com
```

---

## 3. Configure Supabase for Production

### Update Supabase Auth URLs:

1. **Go to Supabase Dashboard → Authentication → URL Configuration**
2. **Update Site URL:**
   ```
   https://familytask.com
   ```

3. **Add Redirect URLs:**
   ```
   https://familytask.com/auth/callback
   https://www.familytask.com/auth/callback
   https://familytask.vercel.app/auth/callback
   http://localhost:3000/auth/callback (for development)
   ```

4. **Update Email Templates** (see SUPABASE-EMAIL-SETUP.md)
   - Replace localhost URLs with production URL

---

## 4. Post-Deployment Checklist

### Verify Deployment:
- [ ] Visit https://familytask.com
- [ ] Test signup flow (email confirmation working?)
- [ ] Test login (redirects working?)
- [ ] Test child dashboard (tasks loading?)
- [ ] Test parent dashboard (children showing?)
- [ ] Test goals auto-update (complete and approve task)
- [ ] Test logout (proper signOut, no alerts)
- [ ] Test profile pages
- [ ] Test notifications bell
- [ ] Test rewards system

### Test in Incognito Mode:
- Fresh session test
- No cached data
- Clean state

### Check Browser Console:
- No errors
- Goals auto-updater initializing
- WebSocket connections working

---

## 5. Production Environment Variables

### Required in Vercel:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App
NEXT_PUBLIC_APP_URL=https://familytask.com
NODE_ENV=production

# Premium Features (when ready)
LEMONSQUEEZY_API_KEY=your_api_key
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=your_store_id

# Email (if using custom SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your_resend_api_key
```

---

## 6. Monitor Deployment

### Vercel Dashboard:
- **Deployments:** https://vercel.com/your-username/familytask/deployments
- **Analytics:** Monitor page views, performance
- **Logs:** Check runtime logs for errors

### Supabase Dashboard:
- **Database:** Monitor query performance
- **Auth:** Check user sign-ups
- **Logs:** API logs, Postgres logs

---

## 7. Continuous Deployment Setup

### Automatic Deployments:
Once connected to GitHub, every push to `main` triggers:
1. Build
2. Test
3. Deploy to production

### Preview Deployments:
Every pull request gets:
- Unique preview URL
- Independent environment
- Test before merging

---

## 8. Rollback Plan

### If Issues Arise:

1. **Instant Rollback in Vercel:**
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Promote to Production"

2. **Revert Code:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## 9. Performance Optimization

### After Deployment:

1. **Enable Vercel Analytics**
   - Project Settings → Analytics → Enable

2. **Configure Caching**
   - Already optimized in build
   - Static pages cached automatically

3. **Monitor Core Web Vitals**
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

---

## 10. Security Checklist

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables secured (not in client code)
- [ ] Supabase RLS policies active
- [ ] API routes authenticated
- [ ] CORS configured properly
- [ ] Rate limiting active
- [ ] SQL injection prevented (using Supabase client)
- [ ] XSS prevented (React escaping)

---

## Next Steps After Deployment

1. **✅ Monitor First 24 Hours**
   - Check error logs
   - Monitor sign-ups
   - Watch performance metrics

2. **📧 Configure Email Support**
   - Follow guide: `SUPABASE-EMAIL-SETUP.md`
   - Set up custom SMTP (Resend recommended)
   - Test all email templates

3. **👥 Set Up User Registration Limits**
   - Follow guide: `USER-REGISTRATION-LIMITS.md`
   - Run SQL scripts in Supabase
   - Set initial limit (e.g., 1000 users)

4. **💰 Integrate Lemon Squeezy**
   - Follow guide: `LEMON-SQUEEZY-SETUP.md`
   - Create products
   - Configure webhooks
   - Test checkout flow

5. **📊 Set Up Analytics**
   - Connect Google Analytics (optional)
   - Vercel Analytics (included)
   - Monitor user behavior

6. **🐛 Error Tracking**
   - Consider Sentry integration
   - Monitor production errors
   - Set up alerts

---

## Deployment Commands Summary

```bash
# Quick Deployment (Vercel CLI)
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs familytask --follow

# Set environment variable
vercel env add VARIABLE_NAME

# Pull production environment locally
vercel env pull .env.local
```

---

## Support & Troubleshooting

### Common Issues:

**Build Fails:**
- Check environment variables
- Clear Vercel build cache
- Review build logs

**Supabase Connection Issues:**
- Verify API keys
- Check Supabase project status
- Validate redirect URLs

**Domain Not Working:**
- DNS propagation (wait 24-48h)
- Check nameservers
- Verify SSL certificate

**Goals Not Auto-Updating:**
- Check browser console (F12)
- Verify GoalsAutoUpdater logs
- Confirm Supabase real-time enabled

---

## 🚀 You're Ready to Deploy!

Run: `vercel --prod` or push to GitHub to deploy automatically.
