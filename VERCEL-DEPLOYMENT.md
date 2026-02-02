# Vercel Deployment Guide

Complete guide for deploying the Family Task Manager to Vercel with proper environment configuration.

## 🚀 Required Environment Variables

Configure these in **Vercel Project Settings → Environment Variables**

### Public Variables (Client + Server)

These are prefixed with `NEXT_PUBLIC_` and are exposed to the browser:

| Variable | Example Value | Source |
|----------|---------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Dashboard → Settings → API → Project API keys → anon/public |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Your Vercel deployment URL (or `http://localhost:3000` locally) |

### Server-Only Variables (⚠️ Never Expose to Browser)

These have **NO** `NEXT_PUBLIC_` prefix and are only available server-side:

| Variable | Example Value | Source | Required |
|----------|---------------|--------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase Dashboard → Settings → API → Project API keys → service_role | ⚠️ **Yes** (bypasses RLS, admin access) |
| `DATABASE_URL` | `postgresql://...` | For Prisma (if used) | Optional |
| `DIRECT_DATABASE_URL` | `postgresql://...` | For Prisma migrations | Optional |
| `NEXTAUTH_SECRET` | Random string | For NextAuth.js sessions | Optional |

---

## � Security Best Practices

1. **Never commit secrets to git**
   - Add `.env.local` to `.gitignore` (already done)
   - Never hardcode API keys in code

2. **Use server-only variables correctly**
   - Server-only vars have NO `NEXT_PUBLIC_` prefix
   - Access them only in API routes, server components, or `getServerSideProps`
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client

3. **Rotate keys if exposed**
   - If secrets are accidentally committed or exposed, rotate them immediately in Supabase
   - Update all deployment environments with new keys

---

## �📝 Deployment Steps

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

### Setup .env.local (Never commit this file!)
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local with your actual values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Verify Your Configuration
Run these scripts to check your environment setup:

```bash
# Check that all required variables are set correctly
node utils/verify-env.js

# Test direct Supabase API connectivity
node test-direct-api.js
```

### Run Development Server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🧹 Backup & Cleanup

### Archive Old Backup Folders
This repository contains several backup folders from previous work. To keep the repository clean:

```bash
# Move backup folders to an archive directory
mkdir -p archive
mv app-backup-before-restore-170741 archive/
mv auth-backup-20260129-143931 archive/
mv backup_2026-01-26_21-37 archive/
mv backup_2026-01-26_21-38 archive/
mv backups archive/

# Optional: Add to .gitignore if not already there
echo "archive/" >> .gitignore
```

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

3. **Rotate all exposed secrets** immediately in Supabase Dashboard

---

## 🌐 Production URL
Your production app will be available at:
`https://family-task-manager-4pcm.vercel.app`

Preview deployments get automatic URLs like:
`https://family-task-manager-git-branch-name-username.vercel.app`

