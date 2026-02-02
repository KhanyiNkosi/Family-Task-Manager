# VERCEL DEPLOYMENT INSTRUCTIONS

## 🚀 VERCEL DEPLOYMENT SETUP

### 1. Push your code to GitHub/GitLab:
```bash
git add .
git commit -m 'Setup Supabase SSR migration'
git push origin main
```

### 2. Import your project in Vercel:
- Go to: https://vercel.com/new
- Import your Git repository

### 3. Set these Environment Variables in Vercel:
**Project Settings → Environment Variables**

#### ✅ Required Environment Variables

##### Public Variables (exposed to browser):
- `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-ref.supabase.co`
  - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key-here`
  - Public anonymous key for client-side operations
- `NEXT_PUBLIC_APP_URL` = `https://family-task-manager-4pcm.vercel.app`
  - Your production app URL (used for redirects)

##### Server-Only Variables (never exposed to browser):
- `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key-here`
  - Admin-level access key (NEVER expose to client)
- `DATABASE_URL` = `your-postgres-connection-string`
  - Direct database connection (optional, for Prisma)
- `DIRECT_DATABASE_URL` = `your-direct-postgres-connection-string`
  - Direct database connection without pooling (optional)
- `NEXTAUTH_SECRET` = `your-random-secret-string`
  - Secret for NextAuth session encryption (optional, if using NextAuth)

### 4. For Preview/Development branches:
- Vercel will automatically set `VERCEL_URL`
- Our code will use: `https://${VERCEL_URL}`

### 5. Deploy!
- Vercel will auto-deploy when you push to main
- For manual deploy: Click 'Deploy' in Vercel dashboard

### 🌐 Your production URL will be:
`https://family-task-manager-4pcm.vercel.app`

---

## 🔧 Local Development

### Environment Variables Setup

Create a `.env.local` file in your project root (DO NOT COMMIT):

```bash
# Public variables (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-only variables (never exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-random-secret
```

### Verification Commands

Run these commands locally to verify your environment setup:

```bash
# Verify environment variables are set correctly
node utils/verify-env.js

# Test direct Supabase API connection (requires valid keys)
node test-direct-api.js

# Run the development server
npm run dev
```

### ⚠️ Security Notes

1. **NEVER commit `.env.local` to version control** - it's already in `.gitignore`
2. **NEVER expose server-only keys** (SERVICE_ROLE_KEY, DATABASE_URL, NEXTAUTH_SECRET) to the client
3. **Keep your anon key public** - it's safe to expose, but still treat it carefully
4. **Rotate keys immediately** if you accidentally commit or expose server-only keys

### 📦 Backup Folders

**Recommended:** Move backup folders to an `/archive` directory:

```bash
mkdir -p archive
mv app-backup-* archive/
mv auth-backup-* archive/
mv backup_* archive/
mv backups archive/
```

This keeps your project root clean and organized.
