# Family Task Manager 👨‍👩‍👧‍👦

A Next.js application for managing family tasks, rewards, and collaboration with Supabase authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account ([create one free](https://supabase.com))

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/KhanyiNkosi/Family-Task-Manager.git
cd Family-Task-Manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```bash
# Copy the template
cp .env.local.example .env.local
```

Add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Where to find these values:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project → Settings → API
- Copy the Project URL and API keys

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Verify Your Setup

Test that environment variables are configured correctly:

```bash
# Check environment configuration
node utils/verify-env.js

# Test Supabase API connectivity
node test-direct-api.js
```

## 📋 Production Deployment

See [VERCEL-DEPLOYMENT.md](./VERCEL-DEPLOYMENT.md) for complete Vercel deployment instructions including:
- Environment variable configuration
- CI/CD setup
- Security best practices

### Health Check

Once deployed, verify your production instance:

```bash
curl https://your-app.vercel.app/api/health
```

## 🔐 Security Notes

- **Never commit `.env.local`** - It's in `.gitignore` by default
- **Rotate keys if exposed** - See [Key Rotation Guide](./VERCEL-DEPLOYMENT.md#security-best-practices)
- **Server-only secrets** - `SUPABASE_SERVICE_ROLE_KEY` should never be exposed to the client

## 🧪 Testing

```bash
# Run smoke tests (requires env vars)
npm run test

# Run E2E tests
npm run test:e2e
```

## 📚 Project Structure

```
├── app/                  # Next.js app directory
│   ├── api/             # API routes (auth, tasks, etc.)
│   ├── components/      # Shared components
│   └── lib/             # Utilities and configurations
├── archive/             # Backup files (not in version control)
├── tests/               # E2E and integration tests
└── utils/               # Build and verification scripts
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

## 📄 License

MIT

---

**Production URL:** https://family-task-manager-4pcm.vercel.app
