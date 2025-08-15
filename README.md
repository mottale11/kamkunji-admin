# Kamkunji Ndogo Admin Frontend

A modern, responsive admin dashboard for managing the Kamkunji Ndogo marketplace.

## Features

- 🔐 **Secure Authentication** - Supabase-powered login system
- 📊 **Dashboard Analytics** - Overview of products, orders, and submissions
- 🛍️ **Product Management** - Add, edit, and manage marketplace products
- 📦 **Order Management** - Track and manage customer orders
- 👥 **User Management** - Manage marketplace users and sellers
- 📝 **Submission Review** - Review and approve item submissions
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI components
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase project with authentication enabled
- Admin users table created in your database

### Installation

1. **Clone and install dependencies**
   ```bash
   cd admin-frontend
   npm install
   ```

2. **Set up environment variables**
   Create a `.env.local` file in the `admin-frontend` directory:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Set up database schema**
   Run the SQL script in your Supabase SQL editor:
   ```bash
   # Copy and paste the contents of scripts/setup-admin-table.sql
   # into your Supabase SQL editor and run it
   ```

4. **Create your first admin user**
   ```bash
   node scripts/create-admin-user.js admin@kamkunjindogo.com yourSecurePassword123
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the admin portal**
   Navigate to `http://localhost:5173/admin/login`

## Project Structure

```
admin-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   └── ui/             # Base UI components (Radix UI)
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries and configurations
│   ├── pages/              # Page components
│   │   └── admin/          # Admin pages
│   └── main.tsx            # Application entry point
├── scripts/                # Setup and utility scripts
├── public/                 # Static assets
└── package.json            # Dependencies and scripts
```

## Authentication Flow

1. **User Login**: Admin enters email/password
2. **Supabase Auth**: Credentials verified against Supabase Auth
3. **Admin Verification**: System checks if user exists in `admin_users` table
4. **Session Creation**: JWT token stored in localStorage
5. **Dashboard Access**: User redirected to admin dashboard

## Security Features

- **Row Level Security (RLS)** enabled on all admin tables
- **JWT tokens** managed by Supabase
- **Admin privileges** verified on every login
- **Automatic sign-out** for non-admin users
- **Secure environment variables** for sensitive data

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes (for scripts) |
| `VITE_API_URL` | Backend API URL (if using) | No |

## Database Schema

### admin_users Table
- `id`: Unique identifier
- `user_id`: References Supabase auth.users
- `role`: Admin role (admin, super_admin, moderator)
- `permissions`: JSON object with specific permissions
- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `.env.local` exists with correct values
   - Restart dev server after adding environment variables

2. **"Access denied. Admin privileges required"**
   - Verify user exists in `admin_users` table
   - Check user_id matches authenticated user

3. **"Authentication failed"**
   - Verify email/password combination
   - Check user account exists in Supabase Auth

### Debug Mode
Add `VITE_DEBUG=true` to your `.env.local` for additional logging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the [Supabase documentation](https://supabase.com/docs)
- Review the setup guide in `SUPABASE_SETUP.md`
- Check the troubleshooting section above

## License

This project is part of the Kamkunji Ndogo marketplace platform.
