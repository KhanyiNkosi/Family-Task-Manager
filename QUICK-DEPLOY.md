# 🚀 Quick Deploy Guide - Family Task Manager

## Deploy to Vercel (5 minutes)

### Method 1: Via Vercel CLI (Fastest)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   # Navigate to project directory
   cd C:\Users\Dell\Family-Task-Manager-New
   
   # Deploy to production
   vercel --prod
   ```

4. **Configure Environment Variables (IMPORTANT!):**
   
   The CLI will ask you to set up environment variables. Add these:
   
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://eailwpyubcopzikpblep.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your anon key from .env.local]
   SUPABASE_SERVICE_ROLE_KEY = [your service role key]
   ```

5. **Done!** Your app is live at the URL shown in terminal.

---

### Method 2: Via Vercel Dashboard (Easiest)

1. **Go to:** [vercel.com/new](https://vercel.com/new)

2. **Import Git Repository:**
   - Click "Add New Project"
   - If using GitHub: Connect your GitHub account and select repo
   - If not in Git: Use "Import from Git" and paste repo URL

3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (or leave default)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables:**
   
   Click "Environment Variables" and add:
   
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://eailwpyubcopzikpblep.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | [Copy from .env.local] |
   | `SUPABASE_SERVICE_ROLE_KEY` | [Get from Supabase Dashboard] |
   
   **Important:** Apply to: Production, Preview, Development

5. **Click "Deploy"** - Wait 2-3 minutes

6. **Done!** Visit your deployment URL

---

## After Deployment

### ✅ Immediate Tests:

1. **Test Login:**
   - Go to `https://your-app.vercel.app/login`
   - Try logging in with test account
   - Should redirect to appropriate dashboard

2. **Test Registration:**
   - Go to `/register`
   - Create a test account
   - Verify email works

3. **Test Core Features:**
   - Parent can create tasks ✓
   - Child can view tasks ✓
   - Reward system works ✓
   - Premium gating works ✓
   - Notifications redirect properly ✓

### 🔗 Save These URLs:

- **Production:** `https://your-app.vercel.app`
- **Vercel Dashboard:** `https://vercel.com/dashboard`
- **Supabase Dashboard:** `https://supabase.com/dashboard`

---

## Troubleshooting

### Build Failed?

**Check logs in Vercel dashboard:**
1. Go to deployments
2. Click failed deployment
3. View build logs
4. Common fixes:
   - Missing environment variables
   - TypeScript errors
   - Dependency issues

**Solution:**
```bash
# Test build locally first
npm run build

# If successful, redeploy
vercel --prod
```

### Environment Variables Not Working?

**Verify in Vercel Dashboard:**
1. Project Settings → Environment Variables
2. Make sure all 3 variables are set
3. Make sure applied to all environments
4. Redeploy after changing variables

### Database Connection Failed?

**Check Supabase:**
1. Project is active
2. URL and keys are correct
3. RLS policies allow connections
4. Test with local build first

---

## Custom Domain (Optional)

### Add Your Own Domain:

1. **In Vercel Dashboard:**
   - Project Settings → Domains
   - Add domain (e.g., `familytaskmanager.com`)

2. **Update DNS:**
   - Add CNAME record in your domain registrar
   - Point to: `cname.vercel-dns.com`
   - Wait for DNS propagation (5-60 minutes)

3. **SSL Certificate:**
   - Automatically provisioned by Vercel
   - Takes 1-2 minutes

---

## Continuous Deployment

Once connected to Git:
- **Push to main/master** → Auto-deploys to production
- **Push to other branches** → Creates preview deployment  
- **Pull Requests** → Automatic preview links

---

## Monitoring

### View Logs:
1. Vercel Dashboard → Project
2. Click "Logs" tab
3. Filter by: Runtime logs, Build logs, Error logs

### Analytics:
- Vercel Dashboard → Analytics
- See page views, performance, top pages
- Free on hobby plan

---

## Need Help?

**Check these files:**
- `DEPLOYMENT-CHECKLIST.md` - Complete deployment guide
- `VERCEL-DEPLOYMENT.md` - Detailed Vercel configuration
- `RESEND-INTEGRATION-GUIDE.md` - Email setup (after Cloudflare fix)

**Deployment Date:** _______________
**Production URL:** _______________
**Status:** _______________

---

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Share URL with team/users
3. ⏳ Wait for Cloudflare/Resend resolution
4. 📧 Implement email notifications (see RESEND-INTEGRATION-GUIDE.md)
5. 📊 Set up monitoring and analytics
6. 🎨 Add custom domain (optional)
7. 🚀 Plan next features

**🎉 Congratulations on deploying!**
