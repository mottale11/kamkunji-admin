# 🚀 Quick Setup Guide

## Fix "Login failed invalid api key" Error

### Step 1: Get Your Supabase Credentials

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Select your project** (or create one if you don't have it)
3. **Go to Settings → API**
4. **Copy these values:**
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Step 2: Create Environment File

Create a file named `.env.local` in the `admin-frontend` directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
```

**Example:**
```bash
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU2NzI5MCwiZXhwIjoxOTUyMTQzMjkwfQ.example
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM2NTY3MjkwLCJleHAiOjE5NTIxNDMyOTB9.example
```

### Step 3: Restart Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Check Console for Success

You should see:
```
✅ Supabase configuration loaded successfully
   URL: https://your-project-id.supabase.co
   Key: ***abcd
✅ Supabase connection test successful
```

## 🔍 Troubleshooting

### Still getting "invalid api key"?

1. **Check your .env.local file exists** in the `admin-frontend` directory
2. **Verify the credentials** - copy them exactly from Supabase dashboard
3. **Restart the server** after creating/updating .env.local
4. **Check the console** for detailed error messages

### Common Issues:

- **Wrong key type**: Make sure you're using the `anon public` key, not the `service_role` key
- **Extra spaces**: Don't add spaces around the `=` sign
- **Wrong file location**: `.env.local` must be in the `admin-frontend` directory
- **File extension**: Make sure it's `.env.local`, not `.env.local.txt`

## 📱 Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active
3. Make sure you have the correct project selected in Supabase dashboard
