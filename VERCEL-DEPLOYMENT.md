# VERCEL DEPLOYMENT INSTRUCTIONS

## 🚀 Environment Variables Reference

### Required Environment Variables

Configure these in Vercel Project Settings → Environment Variables:

#### Public Variables (accessible in browser and server)
These are prefixed with `NEXT_PUBLIC_` and are embedded in the client bundle:

- **NEXT_PUBLIC_SUPABASE_URL** = `https://your-project-ref.supabase.co`
  - Your Supabase project URL
  - Get from: Supabase Dashboard → Project Settings → API
  
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Supabase anon/public key (JWT token starting with "eyJ")
  - Get from: Supabase Dashboard → Project Settings → API
  
- **NEXT_PUBLIC_APP_URL** = `https://your-app.vercel.app` (production) or `http://localhost:3000` (local)
  - The base URL of your application
  - Used for auth callbacks and redirects

#### Server-Only Variables (⚠️ NEVER expose to browser)
These are ONLY available on the server and must be kept secret:

- **SUPABASE_SERVICE_ROLE_KEY** = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Supabase service role key with admin privileges
  - Get from: Supabase Dashboard → Project Settings → API
  - **WARNING**: This key bypasses Row Level Security (RLS)
  
- **DATABASE_URL** (optional)
  - Direct Prisma/database connection string if using Prisma
  
- **DIRECT_DATABASE_URL** (optional)
  - Direct database URL for migrations
  
- **NEXTAUTH_SECRET** (optional)
  - Secret for NextAuth.js session encryption if using NextAuth

> **🔒 Security Note**: Server-only variables are never sent to the browser. They should be treated as highly sensitive credentials.

---

## 📝 Deployment Steps

### 1. Push your code to GitHub/GitLab
```bash
git add .
git commit -m "Setup Supabase SSR migration"
git push origin main
```

### 2. Import your project in Vercel
- Go to: https://vercel.com/new
- Import your Git repository

### 3. Configure Environment Variables
In Vercel Project Settings → Environment Variables, add all variables listed above.

⚠️ **Important**: 
- Set server-only variables for Production, Preview, and Development environments
- Never commit `.env.local` to version control

### 4. Deploy!
- Vercel will auto-deploy when you push to main
- For manual deploy: Click "Deploy" in Vercel dashboard

---

## 🔧 Local Development

### Setup .env.local (⚠️ Never commit this file!)

Create a `.env.local` file in the project root with your actual Supabase credentials:

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local with your actual values from Supabase Dashboard
```

**Example .env.local structure:**
```bash
# Public variables (accessible in browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-only variables (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Database connection strings
# DATABASE_URL=postgresql://...
# DIRECT_DATABASE_URL=postgresql://...
# NEXTAUTH_SECRET=your-secret-key-here
```

> **🚨 CRITICAL**: Never commit `.env.local` to version control! It's already in `.gitignore`. If you accidentally commit secrets, immediately rotate them in Supabase Dashboard.

### Verify Your Configuration

Run these scripts to check your environment setup:

```bash
# Check that all required variables are set correctly
node utils/verify-env.js

# Test direct Supabase API connectivity (requires valid credentials)
node test-direct-api.js
```

These scripts will:
- ✅ Verify environment variables are properly set
- ✅ Check that JWT tokens are in the correct format
- ✅ Test authentication against your Supabase instance
- ❌ Report any configuration issues with clear instructions

### Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🧹 Backup & Cleanup

### Archive Old Backup Folders

This repository contains several backup folders from previous work. To keep the repository clean and organized:

```bash
# Create an archive directory for old backups
mkdir -p archive

# Move backup folders to the archive directory
mv app-backup-before-restore-170741 archive/ 2>/dev/null || true
mv auth-backup-20260129-143931 archive/ 2>/dev/null || true
mv backup_2026-01-26_21-37 archive/ 2>/dev/null || true
mv backup_2026-01-26_21-38 archive/ 2>/dev/null || true
mv backups archive/ 2>/dev/null || true

# Add archive to .gitignore if not already there
echo "archive/" >> .gitignore
```

> **📁 Recommendation**: Move all backup folders to `/archive` to keep your working directory clean. The archive directory is ignored by git and won't be committed.

### If Secrets Were Accidentally Committed

If you accidentally committed `.env.local` or secrets to git history:

1. **Remove from current commit**:
   ```bash
   git rm --cached .env.local
   git commit -m "Remove .env.local from tracking"
   ```

2. **Scrub from git history** (use with caution):
   ```bash
   # Use BFG Repo-Cleaner or git filter-branch
   # See: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
   ```

3. **Rotate all exposed secrets** immediately in Supabase Dashboard:
   - Go to: Supabase Dashboard → Project Settings → API
   - Click "Reset" on any exposed keys
   - Update your `.env.local` with the new keys
   - Update Vercel environment variables with new keys

> **🔒 Security Best Practice**: Treat all Supabase keys (especially `SUPABASE_SERVICE_ROLE_KEY`) as highly sensitive. Never commit them, share them publicly, or expose them in client-side code.

---

## 🌐 Production URL
Your production app will be available at:
`https://family-task-manager-4pcm.vercel.app`

Preview deployments get automatic URLs like:
`https://family-task-manager-git-branch-name-username.vercel.app`

