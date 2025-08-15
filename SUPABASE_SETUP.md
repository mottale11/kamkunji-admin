# Supabase Setup for Admin Frontend

## Prerequisites
- A Supabase project with authentication enabled
- Admin users table created in your Supabase database

## Setup Steps

### 1. Create Environment File
Create a `.env.local` file in the `admin-frontend` directory with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Database Schema
Ensure you have an `admin_users` table in your Supabase database with the following structure:

```sql
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admin users can view their own record" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage admin users" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');
```

### 3. Create Admin User
To create an admin user:

1. First, create a regular user account through Supabase Auth
2. Then insert a record into the `admin_users` table:

```sql
INSERT INTO admin_users (user_id, role, permissions)
VALUES (
  'user-uuid-from-auth', 
  'admin', 
  '{"can_manage_products": true, "can_manage_orders": true, "can_manage_users": true}'
);
```

### 4. Test Login
1. Start the development server: `npm run dev`
2. Navigate to `/admin/login`
3. Use your admin credentials to log in

## How It Works

The admin login system:

1. **Authenticates** users through Supabase Auth
2. **Verifies** admin privileges by checking the `admin_users` table
3. **Stores** the session token and admin user data in localStorage
4. **Redirects** to the admin dashboard on successful login

## Security Features

- Row Level Security (RLS) enabled on admin tables
- Admin privileges verified on every login
- Session tokens managed by Supabase
- Automatic sign-out for non-admin users

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check that `.env.local` exists and has correct values
   - Restart the development server after adding environment variables

2. **"Access denied. Admin privileges required"**
   - Verify the user exists in the `admin_users` table
   - Check that the `user_id` matches the authenticated user's ID

3. **"Authentication failed"**
   - Verify the email/password combination
   - Check that the user account exists in Supabase Auth

### Debug Mode
To enable debug logging, add this to your `.env.local`:

```bash
VITE_DEBUG=true
```

## Support
For issues related to:
- Supabase setup: Check [Supabase documentation](https://supabase.com/docs)
- Admin frontend: Check the project repository
- Authentication: Verify your Supabase project settings
