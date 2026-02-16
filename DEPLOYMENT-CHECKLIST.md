# 🚀 Deployment Checklist - Family Task Manager

## Pre-Deployment Tasks

### ✅ 1. Code Quality
- [x] Notification routing fixed (using Next.js router)
- [x] Premium subscription gating implemented
- [x] Reward suggestion system working
- [x] All TypeScript errors resolved
- [ ] Run final tests: `npm run lint`
- [ ] Test build locally: `npm run build`

### ✅ 2. Environment Variables

#### Required for Production:
```bash
# PUBLIC (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://eailwpyubcopzikpblep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# SERVER ONLY (keep secret)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Future: Resend Email Integration
```bash
# Add these when Cloudflare/Resend issue is resolved
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=support@familytaskmanager.com
```

### ✅ 3. Database Status
- [x] Supabase project configured
- [x] RLS policies enabled
- [x] Notification system tables created
- [x] Reward suggestions working
- [x] Premium subscription system ready

---

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

#### Quick Deploy:
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel --prod
   ```

4. Configure environment variables in Vercel dashboard:
   - Go to: Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Make sure to set for: Production, Preview, Development

#### Or use Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure environment variables
5. Click "Deploy"

**Deployment URL:** Your app will be at `https://your-project.vercel.app`

**Custom Domain:** Add in Project Settings → Domains

---

### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm i -g netlify-cli
   ```

2. Login and deploy:
   ```bash
   netlify login
   netlify init
   netlify deploy --prod
   ```

3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

---

### Option 3: Railway / Render / Fly.io

Similar process:
1. Connect Git repository
2. Set environment variables
3. Configure build command: `npm run build`
4. Configure start command: `npm start`

---

## Post-Deployment Verification

### ✅ Manual Testing Checklist:

#### Authentication:
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Password reset works

#### Parent Features:
- [ ] Can create tasks
- [ ] Can approve/reject reward requests
- [ ] Premium subscription gating works
- [ ] Notifications appear and redirect correctly
- [ ] Family code generation works

#### Child Features:
- [ ] Can view tasks
- [ ] Can redeem rewards
- [ ] Can suggest rewards
- [ ] Points calculation correct
- [ ] Notifications appear and redirect correctly

#### Premium Features:
- [ ] Non-premium parents blocked from approving suggestions
- [ ] Non-premium parents blocked from rejecting suggestions
- [ ] Upgrade button redirects to subscription page
- [ ] Visual indicators (crown icons, badges) display correctly

### 🔗 Important URLs to Test:
- `/login` - Login page
- `/register` - Registration page
- `/parent-dashboard` - Parent dashboard
- `/child-dashboard` - Child dashboard
- `/rewards-store` - Reward store (parent)
- `/my-rewards` - My rewards (child)
- `/contact-support` - Contact support form
- `/settings` - User settings
- `/subscription` - Subscription management

---

## ⚠️ Known Issues / Future Work

### Pending: Email Integration (Resend)
**Status:** Waiting for Cloudflare/Resend issue resolution

**What needs to be done:**
1. Resolve Cloudflare DNS/Resend API issue
2. Configure Resend API key
3. Update contact support page to send emails
4. Add notification emails for important events
5. Set up transactional email templates

**Reference:** See `RESEND-INTEGRATION-GUIDE.md` for implementation details

### Future Enhancements:
- [ ] Add email notifications for task assignments
- [ ] Add email notifications for reward approvals
- [ ] Add daily digest emails
- [ ] Improve mobile responsiveness
- [ ] Add PWA support

---

## 🆘 Troubleshooting

### Build Fails:
```bash
# Clear cache and rebuild
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### Environment Variables Not Working:
- Verify all required variables are set
- Check variable names (must match exactly)
- Redeploy after changing variables
- Check Vercel logs for specific errors

### Database Connection Issues:
- Verify Supabase URL and keys
- Check Supabase project is active
- Check RLS policies are correct
- Test connection locally first

### Performance Issues:
- Check Vercel analytics
- Review Next.js build output for large bundles
- Optimize images (use Next.js Image component)
- Enable caching where appropriate

---

## 📊 Monitoring

### Recommended Tools:
1. **Vercel Analytics** - Built-in, free for hobby tier
2. **Supabase Dashboard** - Database metrics and logs
3. **Sentry** (optional) - Error tracking
4. **Google Analytics** (optional) - User behavior

### Key Metrics to Monitor:
- Response time
- Error rate
- Database query performance
- User registration rate
- Subscription conversion rate

---

## 🔄 Continuous Deployment

### Automatic Deployments:
Once connected to Git:
- **Push to `main` branch** → Deploys to production
- **Push to other branches** → Creates preview deployment
- **Pull requests** → Automatic preview deployments

### Manual Deployments:
```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod
```

---

## ✅ Deployment Complete!

After successful deployment:
1. ✅ Test all critical features
2. ✅ Monitor error logs for 24 hours
3. ✅ Share deployment URL with test users
4. ✅ Document any issues found
5. ✅ Set up monitoring alerts

**Next Steps:**
- Resolve Cloudflare/Resend issue
- Implement email notifications
- Add custom domain
- Enable analytics
- Plan feature roadmap

---

## 📞 Support

If you encounter deployment issues:
1. Check this checklist
2. Review `VERCEL-DEPLOYMENT.md` for detailed guide
3. Check Vercel logs in dashboard
4. Review Supabase logs
5. Test locally first with production build: `npm run build && npm start`

**Deployment Date:** _______________
**Deployed By:** _______________
**Production URL:** _______________
