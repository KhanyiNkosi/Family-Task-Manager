# FamilyTask - Complete Project Documentation

> **Last Updated:** February 21, 2026  
> **Version:** 1.0.0  
> **Status:** Production Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Features](#features)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [Payment Integration (Lemon Squeezy)](#payment-integration-lemon-squeezy)
8. [Email Integration (Resend)](#email-integration-resend)
9. [Project Structure](#project-structure)
10. [Key Components](#key-components)
11. [API Routes](#api-routes)
12. [Deployment](#deployment)
13. [Environment Variables](#environment-variables)
14. [Development Workflow](#development-workflow)
15. [Testing](#testing)
16. [Security](#security)
17. [Performance Optimization](#performance-optimization)
18. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**FamilyTask** is a comprehensive family task management web application that helps families organize chores, track tasks, manage rewards, and strengthen family cooperation through gamification.

### Project Goals
- Simplify family task management
- Motivate children through rewards and gamification
- Enable multiple parents to collaborate
- Provide premium features through subscription model
- Ensure data security and privacy

### Target Audience
- Families with children
- Parents looking to organize household chores
- Families who want to teach responsibility through task management

---

## 💻 Technology Stack

### Frontend Framework
- **Next.js 14** - React framework with App Router
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API routes
  - File-based routing
  - React Server Components

### UI & Styling
- **React 18** - UI component library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Heroicons** - Icon library
- **Lucide React** - Additional icons
- **Font Awesome 6.4** - Icon library
- **Google Fonts (Inter)** - Typography

### Backend & Database
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Authentication system
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Storage for file uploads
  - Edge Functions (Deno runtime)

### Payment Processing
- **Lemon Squeezy** - Payment gateway and subscription management
  - Monthly subscriptions
  - Yearly subscriptions
  - Lifetime purchases
  - Webhook handling
  - Customer portal

### Email Service
- **Resend** - Transactional email service
  - Email notifications
  - Authentication emails
  - Custom SMTP integration
  - Auto-reply support

### Monitoring & Analytics
- **Sentry** - Error tracking and monitoring
- **Vercel Analytics** - Web analytics
- **Vercel Speed Insights** - Performance monitoring

### Form Management
- **React Hook Form 7** - Form state management
- **Zod 4** - Schema validation
- **@hookform/resolvers** - Form validation resolvers

### Additional Libraries
- **date-fns** - Date manipulation
- **react-hot-toast** - Toast notifications
- **@supabase/ssr** - Server-side Supabase client
- **@vercel/analytics** - Analytics integration

### Development Tools
- **ESLint** - Code linting
- **Playwright** - E2E testing
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

### Deployment & Hosting
- **Vercel** - Hosting platform
  - Automatic deployments from GitHub
  - Preview deployments
  - Environment variable management
  - Edge network (CDN)
  - Serverless functions

### Version Control
- **Git** - Version control system
- **GitHub** - Code repository and CI/CD

---

## 🏗️ Architecture

### Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Browser                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Next.js Frontend (React)                   │   │
│  │  - App Router (app/)                                  │   │
│  │  - Server Components                                  │   │
│  │  - Client Components                                  │   │
│  │  - Middleware (Auth Guard)                            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─── API Calls
                              │
┌─────────────────────────────┼────────────────────────────────┐
│                         Vercel Edge Network                   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │           Next.js API Routes (app/api/)              │    │
│  │  - Webhook handlers                                   │    │
│  │  - Server-side logic                                  │    │
│  │  - Authentication                                     │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
              │                    │                  │
              │                    │                  │
    ┌─────────▼────────┐  ┌────────▼────────┐  ┌────▼────────┐
    │    Supabase      │  │  Lemon Squeezy  │  │   Resend    │
    │  - PostgreSQL    │  │  - Payments     │  │  - Emails   │
    │  - Auth          │  │  - Subscriptions│  │  - SMTP     │
    │  - Storage       │  │  - Webhooks     │  │             │
    │  - Realtime      │  └─────────────────┘  └─────────────┘
    │  - Edge Functions│
    └──────────────────┘
```

### Data Flow

1. **User Interaction** → Client-side React components
2. **State Management** → React useState, useEffect hooks
3. **API Calls** → Supabase client or Next.js API routes
4. **Database Operations** → PostgreSQL with RLS
5. **Real-time Updates** → Supabase real-time subscriptions
6. **Authentication** → Supabase Auth with JWT
7. **Payments** → Lemon Squeezy webhooks → Supabase Edge Functions
8. **Email Notifications** → Resend SMTP

### Route Structure

```
app/
├── page.tsx                    # Landing page
├── login/                      # Authentication
├── register/                   # User registration
├── parent-dashboard/           # Parent main dashboard
├── child-dashboard/            # Child main dashboard
├── parent-tasks/               # Task management (parent)
├── rewards-store/              # Rewards catalog
├── my-rewards/                 # Child rewards view
├── parent-profile/             # Parent profile management
├── child-profile/              # Child profile view
├── activity-feed/              # Family activity stream
├── achievements/               # Gamification achievements
├── subscription/               # Premium subscription page
├── pricing/                    # Pricing plans
├── settings/                   # User settings
├── contact-support/            # Support ticket creation
├── admin-support/              # Admin support management
└── api/                        # API routes
```

---

## ✨ Features

### Core Features

#### 1. **Task Management**
- Create, assign, and track family tasks
- Set due dates and priorities
- Task categories (chores, homework, etc.)
- Points system for completed tasks
- Task approval workflow (parent → child → parent approval)
- Real-time task updates
- Task history and analytics

#### 2. **Reward System**
- Custom reward catalog per family
- Points-based redemption
- Reward approval workflow
- Default rewards library
- AI-powered reward suggestions
- Reward redemption history

#### 3. **Family Management**
- Unique family codes for family groups
- Multiple children per family
- Two-parent collaboration support
- Family member profiles
- Family activity feed
- Profile photo uploads

#### 4. **Gamification**
- Points system
- Achievement badges
- User levels and XP
- Streaks and progress tracking
- Leaderboards
- Daily/weekly goals

#### 5. **Activity Feed**
- Real-time family activity stream
- Task completions
- Reward redemptions
- Achievements earned
- Reactions (likes, hearts)
- Comments on activities
- Activity deletion with CASCADE (reactions + comments)

#### 6. **Notifications System**
- Real-time in-app notifications
- Email notifications
- Task reminders
- Reward approval requests
- Achievement unlocked notifications
- Bulletin board messages
- Read/unread status

#### 7. **Premium Features** (Subscription)
- Unlimited family members (free: up to 5)
- Advanced task templates
- Custom reward library
- Family analytics dashboard
- Priority email support
- No advertisements
- Early access to new features

#### 8. **Support System**
- Contact support form
- Support ticket management
- Admin support dashboard
- Email notifications for tickets

### User Roles & Permissions

#### Parent Role
- Create and manage tasks
- Approve completed tasks
- Create custom rewards
- Approve reward redemptions
- Manage family members
- View family analytics
- Access all family data

#### Child Role
- View assigned tasks
- Mark tasks as completed
- Browse rewards store
- Redeem rewards with points
- View own profile and stats
- Interact with activity feed

---

## 🗄️ Database Schema

### Core Tables

#### **profiles**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('parent', 'child')),
  family_id TEXT,
  phone TEXT,
  avatar_url TEXT,
  points INTEGER DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  
  -- Premium features
  premium_status TEXT DEFAULT 'free' CHECK (premium_status IN ('free', 'premium', 'lifetime')),
  premium_expires_at TIMESTAMP WITH TIME ZONE,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_subscription_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);
```

#### **families**
```sql
CREATE TABLE families (
  id TEXT PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id),
  family_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **tasks**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL DEFAULT 10,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'approved')),
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  family_id TEXT REFERENCES families(id),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **rewards**
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  family_id TEXT REFERENCES families(id),
  created_by UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'general',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **reward_redemptions**
```sql
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **activity_feed**
```sql
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  family_id TEXT REFERENCES families(id),
  activity_type TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **activity_reactions**
```sql
CREATE TABLE activity_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  reaction_type TEXT CHECK (reaction_type IN ('like', 'love', 'celebrate')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **activity_comments**
```sql
CREATE TABLE activity_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID REFERENCES activity_feed(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **notifications**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **subscriptions** (Lemon Squeezy)
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Lemon Squeezy IDs
  lemonsqueezy_subscription_id TEXT UNIQUE,
  lemonsqueezy_customer_id TEXT,
  lemonsqueezy_order_id TEXT,
  lemonsqueezy_product_id TEXT,
  lemonsqueezy_variant_id TEXT,
  
  -- Status and billing
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'paused')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
  billing_amount DECIMAL(10, 2),
  billing_currency TEXT DEFAULT 'USD',
  
  -- Timestamps
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);
```

#### **achievements**
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT,
  criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **user_achievements**
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  achievement_id UUID REFERENCES achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **user_settings**
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  task_reminders BOOLEAN DEFAULT true,
  daily_summary BOOLEAN DEFAULT false,
  dark_mode BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Foreign Key Cascades

**Important CASCADE Relationships:**
- `reward_redemptions.reward_id` → `rewards.id` (CASCADE DELETE)
- `activity_reactions.activity_id` → `activity_feed.id` (CASCADE DELETE)
- `activity_comments.activity_id` → `activity_feed.id` (CASCADE DELETE)
- All user-related tables → `profiles.id` (CASCADE DELETE)

This ensures data integrity when deleting records.

---

## 🔐 Authentication & Authorization

### Authentication Provider
**Supabase Auth** - JWT-based authentication

### Supported Auth Methods
1. **Email/Password** - Primary authentication method
2. **Magic Link** - Email-based passwordless login
3. **OAuth Providers** (configurable)
   - Google
   - GitHub
   - Facebook

### Authentication Flow

```typescript
// Registration
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      full_name: fullName,
      role: role,
      family_code: familyCode
    }
  }
});

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
});

// Logout
await supabase.auth.signOut();
```

### Row Level Security (RLS)

All tables use PostgreSQL Row Level Security policies:

#### **Tasks Policies**
```sql
-- Users can view their own tasks or family tasks
CREATE POLICY "View own or family tasks"
  ON tasks FOR SELECT
  USING (
    assigned_to = auth.uid() 
    OR family_id IN (
      SELECT family_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Parents can create tasks
CREATE POLICY "Parents create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'parent'
    )
  );
```

#### **Profiles Policies**
```sql
-- Users can view own profile
CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Users can update own profile
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());
```

### Middleware Protection

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession(request);
  
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Role-based access
  if (isParentOnlyRoute(request.nextUrl.pathname)) {
    const profile = await getProfile(session.user.id);
    if (profile.role !== 'parent') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}
```

---

## 💳 Payment Integration (Lemon Squeezy)

### Setup

1. **Create Lemon Squeezy Account**
   - Sign up at https://www.lemonsqueezy.com
   - Create a store
   - Configure tax settings

2. **Create Products**
   - **Premium Monthly**: $9.99/month
   - **Premium Yearly**: $95.99/year (save 20%)
   - **Lifetime Access**: $199.99 one-time

3. **Environment Variables**
```env
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=https://familytask.lemonsqueezy.com/checkout
```

### Webhook Handler

**Supabase Edge Function**: `lemonsqueezy-webhook`

```typescript
// supabase/functions/lemonsqueezy-webhook/index.ts
serve(async (req) => {
  const signature = req.headers.get('x-signature');
  const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET');
  
  // Verify webhook signature
  const isValid = await verifySignature(payload, signature, webhookSecret);
  
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const payload = await req.json();
  const eventName = payload.meta.event_name;
  
  switch (eventName) {
    case 'order_created':
      await handleOrderCreated(payload);
      break;
    case 'subscription_created':
      await handleSubscriptionCreated(payload);
      break;
    case 'subscription_updated':
      await handleSubscriptionUpdated(payload);
      break;
    case 'subscription_cancelled':
      await handleSubscriptionCancelled(payload);
      break;
  }
  
  return new Response('OK', { status: 200 });
});
```

### Webhook Events Handled

1. **order_created** - One-time purchase (lifetime access)
2. **subscription_created** - New subscription started
3. **subscription_updated** - Subscription plan changed
4. **subscription_cancelled** - Subscription cancelled
5. **subscription_resumed** - Subscription reactivated
6. **subscription_expired** - Subscription ended

### Premium Status Check

```typescript
// lib/premium-check.ts
export async function isPremiumUser(userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('premium_status, premium_expires_at')
    .eq('id', userId)
    .single();
  
  if (profile.premium_status === 'lifetime') {
    return true;
  }
  
  if (profile.premium_status === 'premium') {
    return new Date(profile.premium_expires_at) > new Date();
  }
  
  return false;
}
```

### Checkout Flow

```typescript
// app/subscription/page.tsx
const handleCheckout = async (plan: 'monthly' | 'yearly' | 'lifetime') => {
  const checkoutUrl = `${process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL}?plan=${plan}&user_id=${user.id}`;
  window.location.href = checkoutUrl;
};
```

---

## 📧 Email Integration (Resend)

### Setup

1. **Create Resend Account**
   - Sign up at https://resend.com
   - Verify domain
   - Get API key

2. **Environment Variables**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@familytask.com
```

### Email Templates

#### **Welcome Email**
```typescript
await resend.emails.send({
  from: 'FamilyTask <noreply@familytask.com>',
  to: user.email,
  subject: 'Welcome to FamilyTask!',
  html: welcomeEmailTemplate(user.full_name)
});
```

#### **Task Reminder**
```typescript
await resend.emails.send({
  from: 'FamilyTask <noreply@familytask.com>',
  to: child.email,
  subject: 'Task Due Soon: {{task.title}}',
  html: taskReminderTemplate(task)
});
```

#### **Reward Approval Request**
```typescript
await resend.emails.send({
  from: 'FamilyTask <noreply@familytask.com>',
  to: parent.email,
  subject: '{{child.name}} requested a reward',
  html: rewardRequestTemplate(child, reward)
});
```

### SMTP Configuration (Alternative)

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your-api-key
```

---

## 📁 Project Structure

```
Family-Task-Manager-New/
├── app/                                # Next.js App Router
│   ├── page.tsx                        # Landing page
│   ├── layout.tsx                      # Root layout
│   ├── globals.css                     # Global styles
│   │
│   ├── api/                            # API routes
│   │   ├── webhooks/                   # Webhook handlers
│   │   └── health/                     # Health check
│   │
│   ├── login/                          # Login page
│   │   └── page.tsx
│   ├── register/                       # Registration
│   │   ├── page.tsx
│   │   └── success/
│   │       └── page.tsx
│   │
│   ├── parent-dashboard/               # Parent dashboard
│   │   └── page.tsx
│   ├── child-dashboard/                # Child dashboard
│   │   └── page.tsx
│   │
│   ├── parent-tasks/                   # Task management (parent)
│   │   └── page.tsx
│   ├── rewards-store/                  # Rewards catalog
│   │   └── page.tsx
│   ├── my-rewards/                     # Child rewards
│   │   └── page.tsx
│   │
│   ├── parent-profile/                 # Parent profile
│   │   └── page.tsx
│   ├── child-profile/                  # Child profile
│   │   └── page.tsx
│   │
│   ├── activity-feed/                  # Activity feed
│   │   └── page.tsx
│   ├── achievements/                   # Achievements
│   │   └── page.tsx
│   │
│   ├── subscription/                   # Premium subscription
│   │   └── page.tsx
│   ├── pricing/                        # Pricing page
│   │   └── page.tsx
│   │
│   ├── settings/                       # User settings
│   │   └── page.tsx
│   ├── contact-support/                # Support form
│   │   └── page.tsx
│   ├── admin-support/                  # Admin support
│   │   └── page.tsx
│   │
│   └── components/                     # Shared components
│       ├── GoalsAutoUpdater.tsx
│       └── ...
│
├── components/                         # Reusable components
│   ├── Header.tsx                      # Main header
│   ├── Sidebar.tsx                     # Navigation sidebar
│   ├── Navbar.tsx                      # Navigation bar
│   ├── AddChildForm.tsx                # Add child form
│   ├── PremiumGuard.tsx                # Premium feature guard
│   └── UserProfile.tsx                 # User profile display
│
├── lib/                                # Utility libraries
│   ├── supabaseClient.ts               # Supabase client (browser)
│   ├── supabaseServer.ts               # Supabase client (server)
│   ├── database.types.ts               # TypeScript types
│   ├── notifications.ts                # Notification helpers
│   ├── premium-check.ts                # Premium status check
│   └── urls.ts                         # URL constants
│
├── supabase/                           # Supabase config
│   ├── config.toml                     # Supabase config
│   ├── migrations/                     # Database migrations
│   └── functions/                      # Edge functions
│       └── lemonsqueezy-webhook/       # Payment webhook
│           └── index.ts
│
├── public/                             # Static assets
│   ├── favicon.ico
│   ├── images/
│   └── icons/
│
├── hooks/                              # Custom React hooks
│   └── usePremium.ts
│
├── types/                              # TypeScript type definitions
│   └── index.ts
│
├── utils/                              # Utility functions
│   └── verify-env.js
│
├── middleware.ts                       # Next.js middleware (auth guard)
├── instrumentation.ts                  # Instrumentation config
├── next.config.js                      # Next.js configuration
├── tailwind.config.js                  # Tailwind CSS config
├── tsconfig.json                       # TypeScript config
├── package.json                        # Dependencies
├── .env.local                          # Environment variables (local)
├── .gitignore                          # Git ignore rules
│
├── README.md                           # Project README
├── LEMON-SQUEEZY-SETUP.md             # Payment integration guide
├── RESEND-INTEGRATION-GUIDE.md        # Email integration guide
├── VERCEL-DEPLOYMENT-GUIDE.md         # Deployment guide
└── COMPLETE-PROJECT-DOCUMENTATION.md  # This file
```

---

## 🧩 Key Components

### 1. Header Component
**Location**: `components/Header.tsx`

Main navigation header with:
- Logo and branding
- Navigation links
- User profile dropdown
- Notifications badge
- Responsive mobile menu

### 2. Sidebar Component
**Location**: `components/Sidebar.tsx`

Side navigation for authenticated users:
- Dashboard link
- Tasks management
- Rewards store
- Profile settings
- Role-based menu items

### 3. PremiumGuard Component
**Location**: `components/PremiumGuard.tsx`

Restricts access to premium features:
```tsx
<PremiumGuard featureName="Advanced Analytics">
  <AdvancedAnalyticsDashboard />
</PremiumGuard>
```

### 4. AddChildForm Component
**Location**: `components/AddChildForm.tsx`

Form for parents to add children to family:
- Child name and email
- Age selection
- Avatar upload
- Family code association

### 5. NotificationAlert Component
**Location**: `components/NotificationAlert.tsx`

Toast notification system:
- Success messages
- Error alerts
- Warning notifications
- Info messages

### 6. GoalsAutoUpdater Component
**Location**: `app/components/GoalsAutoUpdater.tsx`

Background process that:
- Updates daily/weekly goal progress
- Checks achievement criteria
- Awards badges automatically

---

## 🔌 API Routes

### Webhook Endpoints

#### `/api/webhooks/lemonsqueezy`
Handles Lemon Squeezy payment webhooks:
- Order created
- Subscription created/updated/cancelled
- Payment succeeded/failed

#### `/api/webhooks/resend`
Handles Resend email webhooks:
- Email delivered
- Email bounced
- Email opened

### Utility Endpoints

#### `/api/health`
Health check endpoint:
```json
{
  "status": "ok",
  "timestamp": "2026-02-21T10:30:00Z",
  "version": "1.0.0"
}
```

---

## 🚀 Deployment

### Vercel Deployment

#### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Supabase project
- Lemon Squeezy account (for payments)
- Resend account (for emails)

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/Family-Task-Manager.git
git push -u origin main
```

#### Step 2: Connect to Vercel
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Step 3: Configure Environment Variables

**Required Environment Variables:**

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Lemon Squeezy
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=https://familytask.lemonsqueezy.com/checkout

# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@familytask.com

# Sentry (optional)
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

#### Step 4: Deploy Supabase Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy webhook function
supabase functions deploy lemonsqueezy-webhook

# Set secrets
supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
```

#### Step 5: Configure Webhooks

**Lemon Squeezy Webhook:**
- URL: `https://your-project.supabase.co/functions/v1/lemonsqueezy-webhook`
- Events: All subscription and order events
- Secret: Your webhook secret

**Vercel Deployment:**
```bash
vercel --prod
```

### Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch → Production
- Push to other branches → Preview deployments
- Pull requests → Preview deployments

---

## 🔐 Environment Variables

### Complete List

```env
# ===== Supabase Configuration =====
NEXT_PUBLIC_SUPABASE_URL=https://eailwpyubcopzikpblep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ===== Application Configuration =====
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ===== Lemon Squeezy (Payment Integration) =====
NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL=https://familytask.lemonsqueezy.com/checkout

# ===== Resend (Email Service) =====
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@familytask.com

# Optional: SMTP Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=your-api-key

# ===== Sentry (Error Monitoring) =====
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# ===== Vercel (Production Only) =====
VERCEL_ENV=production
VERCEL_URL=your-app.vercel.app
```

### Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use different keys** for development and production
3. **Rotate keys** if exposed
4. **Server-only secrets** must never be exposed to client
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `LEMONSQUEEZY_API_KEY`
   - `RESEND_API_KEY`

---

## 👨‍💻 Development Workflow

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/Family-Task-Manager.git
cd Family-Task-Manager

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

### Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type checking
npx tsc --noEmit

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# After approval, merge to main
```

### Database Changes

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations locally
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > lib/database.types.ts

# Push to remote
supabase db push --remote
```

---

## 🧪 Testing

### Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── auth.spec.ts        # Authentication tests
│   ├── tasks.spec.ts       # Task management tests
│   ├── rewards.spec.ts     # Reward system tests
│   └── subscription.spec.ts # Payment tests
│
├── integration/            # Integration tests
│   ├── api.test.ts
│   └── database.test.ts
│
└── unit/                   # Unit tests
    ├── utils.test.ts
    └── components.test.tsx
```

### Running Tests

```bash
# Run all tests
npm test

# Run E2E tests with Playwright
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run in UI mode
npx playwright test --ui

# Generate test report
npx playwright show-report
```

### Test Coverage Goals
- Unit tests: 80%+
- Integration tests: 70%+
- E2E tests: Critical user flows

---

## 🔒 Security

### Security Measures Implemented

#### 1. **Authentication Security**
- JWT tokens with expiration
- Secure session management
- Password hashing (bcrypt)
- Email verification required
- Rate limiting on login attempts

#### 2. **Database Security**
- Row Level Security (RLS) on all tables
- Prepared statements (SQL injection prevention)
- Foreign key constraints
- Sensitive data encryption

#### 3. **API Security**
- CORS configuration
- Webhook signature verification
- Request validation with Zod
- Rate limiting

#### 4. **Frontend Security**
- XSS prevention (React escaping)
- CSRF protection
- Content Security Policy (CSP)
- Secure cookies (httpOnly, secure, sameSite)

#### 5. **Payment Security**
- PCI DSS compliant (Lemon Squeezy)
- Webhook signature verification
- No credit card data stored
- Secure checkout flow

#### 6. **Data Privacy**
- GDPR compliant
- User data deletion on request
- Privacy policy
- Terms of service

### Security Checklist

- [x] Environment variables secured
- [x] RLS enabled on all tables
- [x] Webhook signatures verified
- [x] HTTPS enforced
- [x] SQL injection prevented
- [x] XSS protection enabled
- [x] CSRF tokens implemented
- [x] Rate limiting configured
- [x] Error messages sanitized
- [x] Sensitive data encrypted

---

## ⚡ Performance Optimization

### Optimization Techniques

#### 1. **Code Splitting**
- Next.js automatic code splitting
- Dynamic imports for heavy components
- Route-based code splitting

#### 2. **Image Optimization**
```tsx
import Image from 'next/image';

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  placeholder="blur"
  loading="lazy"
/>
```

#### 3. **Database Optimization**
- Indexes on frequently queried columns
- Efficient RLS policies
- Connection pooling
- Query result caching

#### 4. **Caching Strategy**
- Static page generation (SSG)
- Incremental static regeneration (ISR)
- Browser caching headers
- CDN caching (Vercel Edge Network)

#### 5. **Bundle Optimization**
- Tree shaking
- Minification
- Compression (Gzip/Brotli)
- Reduced bundle size (<200KB initial)

#### 6. **Real-time Optimization**
- Supabase real-time subscriptions
- Debounced search inputs
- Optimistic UI updates
- Lazy loading components

### Performance Metrics

**Target Metrics (Lighthouse):**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Supabase connection failed"
**Solution:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify Supabase project is running
# Go to Supabase dashboard → Project Settings → API
```

#### Issue: "RLS policy denying access"
**Solution:**
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Temporarily disable RLS for debugging
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
```

#### Issue: "Webhook signature verification failed"
**Solution:**
```typescript
// Check webhook secret matches
console.log('Expected:', process.env.LEMONSQUEEZY_WEBHOOK_SECRET);
console.log('Received signature:', req.headers.get('x-signature'));

// Verify webhook URL is correct in Lemon Squeezy dashboard
```

#### Issue: "Email not sending"
**Solution:**
```bash
# Check Resend API key
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@familytask.com","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

#### Issue: "Build failing on Vercel"
**Solution:**
```bash
# Check build logs in Vercel dashboard
# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. ESLint errors

# Fix locally first
npm run build
npm run lint
```

### Debug Mode

Enable debug logging:
```env
# .env.local
NEXT_PUBLIC_DEBUG=true
DEBUG=supabase:*
```

---

## 📚 Additional Resources

### Documentation Links

- **Next.js**: https://nextjs.org/docs
- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Supabase**: https://supabase.com/docs
- **Lemon Squeezy**: https://docs.lemonsqueezy.com
- **Resend**: https://resend.com/docs
- **Vercel**: https://vercel.com/docs

### Related Project Documentation

- [README.md](./README.md) - Quick start guide
- [LEMON-SQUEEZY-SETUP.md](./LEMON-SQUEEZY-SETUP.md) - Payment integration
- [RESEND-INTEGRATION-GUIDE.md](./RESEND-INTEGRATION-GUIDE.md) - Email setup
- [VERCEL-DEPLOYMENT-GUIDE.md](./VERCEL-DEPLOYMENT-GUIDE.md) - Deployment guide
- [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) - Pre-deployment checklist

### Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/Family-Task-Manager/issues
- Email: support@familytask.com
- Discord: [Join our community]

---

## 📄 License

Copyright © 2026 FamilyTask. All rights reserved.

This project is proprietary and confidential. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## 🎉 Conclusion

This documentation provides a comprehensive overview of the FamilyTask web application, including:

✅ Complete technology stack overview  
✅ Detailed architecture documentation  
✅ Database schema and relationships  
✅ Authentication and authorization flow  
✅ **Lemon Squeezy payment integration**  
✅ **Resend email integration**  
✅ Deployment procedures  
✅ Security best practices  
✅ Performance optimization techniques  
✅ Troubleshooting guides  

**Project Status:** Production Ready 🚀

**Last Updated:** February 21, 2026  
**Version:** 1.0.0
