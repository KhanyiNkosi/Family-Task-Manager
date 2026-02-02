# Family Code Setup Guide

## 📋 Overview
This guide helps you set up the family code system and automatic profile creation in Supabase.

---

## ⚡ Quick Setup

### Step 1: Run SQL Setup Script

1. **Open Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/eailwpyubcopzikpblep/sql/new

2. **Copy and paste** the contents of `supabase-setup.sql` into the editor

3. **Click "Run"** to execute all statements

This will create:
- ✅ Automatic profile creation trigger
- ✅ Family relationship handling
- ✅ Row Level Security (RLS) policies
- ✅ Proper permissions for parents and children

---

## 🔧 What Was Created

### 1. Database Trigger
**Function**: `handle_new_user()`
- Automatically runs when a user signs up
- Creates entry in `profiles` table
- Creates entry in `user_profiles` table
- Sets family_id:
  - **Parents**: Generate new UUID (new family)
  - **Children**: Use provided family_code from registration

### 2. Row Level Security Policies

#### Profiles Table
- Users can view their own profile
- Users can view all profiles in their family
- Users can update their own profile

#### User Profiles Table
- Users can view their own user profile
- Users can view family members' profiles
- Users can update their own profile

#### Tasks Table
- Users can view tasks in their family
- Parents can create/update/delete tasks
- Children can update only their assigned tasks

---

## 🧪 Testing the Setup

### Test 1: Parent Registration

1. **Register as Parent**:
   - Go to: https://family-task-manager-4pcm.vercel.app/register
   - Select "Parent" role
   - Complete registration

2. **Verify in Database**:
   ```sql
   SELECT 
     u.email,
     p.family_id,
     up.role
   FROM auth.users u
   JOIN public.profiles p ON u.id = p.id
   JOIN public.user_profiles up ON u.id = up.id
   WHERE u.email = 'your-parent-email@example.com';
   ```
   - Should show a unique `family_id` (UUID)
   - Role should be 'parent'

3. **Get Family Code**:
   - Login to parent dashboard
   - Family code is displayed in the "Family Invitation Code" card
   - Copy this code for child registration

### Test 2: Child Registration

1. **Register as Child**:
   - Go to: https://family-task-manager-4pcm.vercel.app/register
   - Select "Child" role
   - **Important**: Enter the parent's family code
   - Complete registration

2. **Verify Family Link**:
   ```sql
   SELECT 
     u.email,
     p.family_id,
     up.role,
     up.total_points
   FROM auth.users u
   JOIN public.profiles p ON u.id = p.id
   JOIN public.user_profiles up ON u.id = up.id
   WHERE u.email = 'your-child-email@example.com';
   ```
   - `family_id` should match the parent's family_id
   - Role should be 'child'
   - `total_points` should be 0

3. **Verify in Parent Dashboard**:
   - Login as parent
   - Navigate to parent dashboard
   - Child should appear in "Family Members" section

### Test 3: Family Code Validation

1. **Try Invalid Code**:
   - Register as child
   - Enter a random/invalid family code
   - Should see error: "Invalid family code. Please check with your parent."

2. **Try Valid Code**:
   - Use the actual family code from parent dashboard
   - Registration should proceed successfully

---

## 🔍 Troubleshooting

### Issue: Children not appearing in parent dashboard

**Check 1**: Verify family_id matches
```sql
SELECT email, family_id FROM public.profiles 
WHERE family_id = 'YOUR_FAMILY_ID_HERE';
```

**Check 2**: Verify user_profiles role
```sql
SELECT p.email, up.role 
FROM public.profiles p
JOIN public.user_profiles up ON p.id = up.id
WHERE p.family_id = 'YOUR_FAMILY_ID_HERE';
```

**Solution**: If family_id doesn't match, update manually:
```sql
UPDATE public.profiles 
SET family_id = 'PARENT_FAMILY_ID_HERE'
WHERE email = 'child-email@example.com';
```

### Issue: Profile not created automatically

**Check**: Verify trigger exists
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

**Solution**: Re-run the `supabase-setup.sql` script

### Issue: Permission denied errors

**Check**: Verify RLS policies exist
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

**Solution**: Re-run the RLS policy section of `supabase-setup.sql`

---

## 📊 Database Schema Reference

### profiles table
```sql
id          UUID PRIMARY KEY (references auth.users)
email       TEXT
full_name   TEXT
family_id   UUID (generated for parents, copied from family_code for children)
created_at  TIMESTAMPTZ
updated_at  TIMESTAMPTZ
```

### user_profiles table
```sql
id           UUID PRIMARY KEY (references auth.users)
role         TEXT (either 'parent' or 'child')
total_points INTEGER (default 0)
created_at   TIMESTAMPTZ
```

### tasks table
```sql
id          UUID PRIMARY KEY
title       TEXT
description TEXT
points      INTEGER
assigned_to UUID (references auth.users)
created_by  UUID (references auth.users)
completed   BOOLEAN
due_date    TIMESTAMPTZ
category    TEXT
```

---

## 🚀 API Endpoints

### GET /api/family/code
**Auth**: Required (Parent only)
**Returns**: Family invitation code
```json
{
  "familyCode": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Share this code with your children to join your family"
}
```

### POST /api/family/validate
**Body**: `{ "familyCode": "string" }`
**Returns**: Validation result
```json
{
  "valid": true,
  "message": "Family code verified successfully",
  "parentName": "Parent Name"
}
```

### GET /api/family/children
**Auth**: Required (Parent only)
**Returns**: List of children in family
```json
{
  "children": [
    {
      "id": "uuid",
      "name": "Child Name",
      "email": "child@example.com",
      "points": 0,
      "joinedAt": "2026-02-02T12:00:00Z"
    }
  ],
  "familyId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## ✅ Verification Checklist

- [ ] SQL setup script executed successfully
- [ ] Parent can register and see family code
- [ ] Child can register with parent's family code
- [ ] Invalid family code shows error message
- [ ] Child appears in parent's dashboard after registration
- [ ] Family members can view each other's profiles
- [ ] RLS policies prevent unauthorized access
- [ ] Tasks can be created by parents
- [ ] Children can see assigned tasks

---

## 🆘 Need Help?

- **Supabase Dashboard**: https://supabase.com/dashboard/project/eailwpyubcopzikpblep
- **SQL Editor**: https://supabase.com/dashboard/project/eailwpyubcopzikpblep/sql/new
- **Authentication**: https://supabase.com/dashboard/project/eailwpyubcopzikpblep/auth/users
- **Logs**: https://supabase.com/dashboard/project/eailwpyubcopzikpblep/logs/explorer

---

**Setup complete! 🎉**
