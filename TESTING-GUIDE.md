# Family Task Manager - Testing Guide

## 🎯 Overview
This guide will help you test all features of the Family Task Manager application.

**Production URL**: https://family-task-manager-4pcm.vercel.app

---

## 📋 Database Schema
The app uses Supabase with the following key tables:

### Tables
- **`auth.users`** - User authentication (managed by Supabase Auth)
- **`public.user_profiles`** - User roles and points
  - `role`: 'parent' or 'child'
  - `total_points`: Accumulated points from completed tasks
- **`public.tasks`** - Task management
  - `title`, `description`, `points`, `category`
  - `assigned_to`: User ID (child)
  - `created_by`: User ID (parent)
  - `completed`: Boolean
  - `due_date`: Timestamp
- **`public.profiles`** - Extended user profiles
  - `full_name`, `email`, `family_id`

---

## 🧪 Testing Checklist

### 1. Authentication Flow ✅

#### Test Registration
1. **Navigate to**: https://family-task-manager-4pcm.vercel.app/register
2. **Fill out form**:
   - Name: Your name
   - Email: Valid email address
   - Password: Strong password
   - Role: Select "Parent" or "Child"
   - Family Code: (Optional) Leave blank or create one
3. **Submit** and verify:
   - ✅ Redirected to `/register/success`
   - ✅ Email confirmation instructions displayed
   - ✅ "Resend Confirmation Email" button available

#### Test Email Confirmation
1. **Check email** for confirmation link (check spam folder)
2. **If no email received**:
   - Visit: https://family-task-manager-4pcm.vercel.app/resend-confirmation
   - Enter your email
   - Click "Resend"
   - **Note**: Rate limited to 3 attempts per hour
3. **Alternative**: Manually confirm via Supabase dashboard:
   ```sql
   UPDATE auth.users 
   SET email_confirmed_at = NOW() 
   WHERE email = 'your-email@example.com';
   ```

#### Test Login
1. **Navigate to**: https://family-task-manager-4pcm.vercel.app/login
2. **Enter credentials**:
   - Email: Your confirmed email
   - Password: Your password
3. **Verify**:
   - ✅ Successfully logged in
   - ✅ Redirected to appropriate dashboard (parent/child)
   - ✅ Session persists on refresh

---

### 2. Parent Dashboard 👨‍👩‍👧‍👦

**URL**: https://family-task-manager-4pcm.vercel.app/parent-dashboard

#### Features to Test:

**A. Task Management**
- [ ] **Create New Task**
  - Fill in: Task name, points, assignee (child), due date
  - Click "Add Task"
  - Verify task appears in "Active Tasks" section
  
- [ ] **View Active Tasks**
  - Check task list displays: title, assignee, points, due date, status
  - Verify task counts are accurate
  
- [ ] **Mark Task as Complete** (if functionality exists)
  - Click complete button on task
  - Verify task moves to completed state
  - Check child's points updated

**B. Children Overview**
- [ ] View registered children
- [ ] See each child's:
  - Total points
  - Tasks completed count
  - Avatar/profile picture
  
**C. Bulletin Board**
- [ ] Post new message to family bulletin
- [ ] View existing messages with timestamps
- [ ] Messages visible to all family members

**D. Reward Requests**
- [ ] View pending reward requests from children
- [ ] Approve/reject reward requests
- [ ] Verify points deducted upon approval

**E. Navigation**
- [ ] Test all navigation links:
  - Home
  - Dashboard (current)
  - AI Tasks
  - Rewards Store
  - AI Suggester
  - Profile

---

### 3. Child Dashboard 🧒

**URL**: https://family-task-manager-4pcm.vercel.app/child-dashboard

#### Features to Test:

**A. Points Display**
- [ ] View current total points
- [ ] Points update after completing tasks
- [ ] Points history/transactions

**B. My Tasks**
- [ ] View assigned tasks
- [ ] See task details: title, description, points, due date
- [ ] Mark tasks as complete
- [ ] Verify completion confirmation

**C. Available Rewards**
- [ ] Browse rewards catalog
- [ ] See required points for each reward
- [ ] Request reward (if have enough points)
- [ ] See pending reward requests

**D. Profile Customization**
- [ ] **Avatar Selection**: Choose from 8 options:
  - Boy 👦, Girl 👧, Robot 🤖, Superhero 🦸
  - Astronaut 🧑‍🚀, Alien 👽, Ninja 🥷, Wizard 🧙
- [ ] Upload profile picture
- [ ] Update display name
- [ ] Changes persist after logout

**E. Permissions Check**
- [ ] Attempt to access parent routes
- [ ] Verify access denied and redirected to child dashboard
- [ ] Test these URLs (should be blocked):
  - `/parent-dashboard`
  - `/parent-profile`
  - `/rewards-store`
  - `/ai-suggester`
  - `/settings`

---

### 4. AI Task Suggester 🤖

**URL**: https://family-task-manager-4pcm.vercel.app/ai-suggester

#### Features to Test:
- [ ] Generate AI-suggested tasks
- [ ] Filter suggestions by:
  - Age group
  - Category (chores, homework, etc.)
  - Difficulty level
- [ ] Accept suggested task
- [ ] Customize suggested task before adding
- [ ] Add multiple suggestions at once

---

### 5. Rewards Store 🏆

**URL**: https://family-task-manager-4pcm.vercel.app/rewards-store

#### Features to Test:

**A. Parent View (Create Rewards)**
- [ ] Add new reward
  - Name, description, point cost, category
  - Optional: Upload reward image
- [ ] Edit existing rewards
- [ ] Delete rewards
- [ ] Set reward availability

**B. Child View (Browse & Request)**
- [ ] View available rewards
- [ ] Filter by category
- [ ] Sort by points (low to high, high to low)
- [ ] Request reward (deducts points)
- [ ] View reward request status

---

### 6. Profile Management 👤

#### Parent Profile
**URL**: https://family-task-manager-4pcm.vercel.app/parent-profile

- [ ] Update profile information
- [ ] Upload profile picture
- [ ] View family code
- [ ] Add children to family
- [ ] Manage family settings

#### Child Profile
**URL**: https://family-task-manager-4pcm.vercel.app/child-profile

- [ ] Change avatar (8 options available)
- [ ] Upload custom profile picture
- [ ] View personal stats:
  - Total points earned
  - Tasks completed
  - Current streak
- [ ] View achievement badges (if implemented)

---

### 7. Database Operations Testing 🗄️

Use Supabase SQL Editor to verify data integrity:

#### Test Task Creation
```sql
-- Check tasks table
SELECT * FROM public.tasks 
ORDER BY created_at DESC 
LIMIT 10;
```

#### Test Points Calculation
```sql
-- Verify user points
SELECT 
  u.email,
  up.role,
  up.total_points,
  COUNT(t.id) as tasks_completed
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.id
LEFT JOIN public.tasks t ON t.assigned_to = u.id AND t.completed = true
GROUP BY u.id, u.email, up.role, up.total_points;
```

#### Test Family Relationships
```sql
-- Check family groupings
SELECT 
  p.family_id,
  COUNT(*) as family_members,
  STRING_AGG(p.full_name, ', ') as members
FROM public.profiles p
GROUP BY p.family_id;
```

---

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **Email Rate Limits**: Supabase limits confirmation emails to ~3-4 per hour
   - **Workaround**: Use SQL to manually confirm emails
   
2. **Data Fetching**: Some dashboards show placeholder data
   - **Status**: TODO comments indicate Supabase integration needed
   - **Check**: Look for "TODO: Add Supabase data fetching here"

3. **Real-time Updates**: Not yet implemented
   - Changes require page refresh to see updates

### Testing Notes:
- Use Chrome DevTools (F12) to check console for errors
- Check Network tab for failed API requests
- Monitor Sentry for backend errors: https://sentry.io/organizations/khanyisile-nkosi/issues/

---

## 🔍 API Endpoints to Test

Use curl or Postman to test these endpoints:

### Authentication
```bash
# Login
curl -X POST https://family-task-manager-4pcm.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Register
curl -X POST https://family-task-manager-4pcm.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","role":"parent"}'

# Resend Confirmation
curl -X POST https://family-task-manager-4pcm.vercel.app/api/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Health Check
```bash
curl https://family-task-manager-4pcm.vercel.app/api/health
```

---

## 📊 Success Criteria

### ✅ Core Features Working:
- [ ] User registration with email confirmation
- [ ] Login/logout functionality
- [ ] Role-based access (parent vs child)
- [ ] Task creation and assignment
- [ ] Task completion and points tracking
- [ ] Profile customization
- [ ] Navigation between pages

### ✅ Data Integrity:
- [ ] User data persists correctly
- [ ] Points calculated accurately
- [ ] Tasks assigned to correct users
- [ ] Family relationships maintained

### ✅ Error Handling:
- [ ] Errors captured in Sentry
- [ ] User-friendly error messages
- [ ] Graceful handling of edge cases

---

## 🚀 Next Steps After Testing

1. **Document Bugs**: Create issues in GitHub for any bugs found
2. **Feature Requests**: List missing features or improvements
3. **Performance**: Note any slow-loading pages or operations
4. **UX Improvements**: Suggest UI/UX enhancements
5. **Database Optimization**: Review query performance in Supabase

---

## 🆘 Troubleshooting

### Can't log in after registration?
- Check email confirmation status in Supabase dashboard
- Run SQL to manually confirm: `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'your-email';`

### Not seeing data on dashboard?
- Open DevTools console (F12) and check for errors
- Verify Supabase connection in Network tab
- Check if TODO comments indicate feature not implemented

### Getting 401 errors?
- Session may have expired - log out and log back in
- Clear browser cookies and try again
- Verify environment variables in Vercel

### Changes not appearing?
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Check if real-time updates are implemented

---

## 📞 Support

- **Sentry Issues**: https://sentry.io/organizations/khanyisile-nkosi/issues/
- **Supabase Dashboard**: https://supabase.com/dashboard/project/eailwpyubcopzikpblep
- **Vercel Deployment**: https://vercel.com/khanyinkosis-projects/family-task-manager-4pcm
- **GitHub Repo**: https://github.com/KhanyiNkosi/Family-Task-Manager

---

**Happy Testing! 🎉**
