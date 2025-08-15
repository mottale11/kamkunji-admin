-- Setup script for admin_users table in Supabase
-- Run this in your Supabase SQL editor

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'moderator')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_users table

-- Policy: Admin users can view their own record
CREATE POLICY "Admin users can view their own record" ON admin_users
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can manage all admin users (for creating new admins)
CREATE POLICY "Service role can manage admin users" ON admin_users
  FOR ALL USING (auth.role() = 'service_role');

-- Policy: Super admins can view all admin users
CREATE POLICY "Super admins can view all admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid() 
      AND au.role = 'super_admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a default super admin (you'll need to replace the user_id with an actual user)
-- This is optional and can be done later using the create-admin-user.js script
-- INSERT INTO admin_users (user_id, role, permissions) VALUES (
--   'your-user-uuid-here',
--   'super_admin',
--   '{"can_manage_products": true, "can_manage_orders": true, "can_manage_users": true, "can_manage_categories": true, "can_view_analytics": true, "can_manage_admins": true}'
-- );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT ALL ON admin_users TO service_role;

-- Create a view for admin dashboard (optional)
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_products_this_week,
  COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_products_this_month
FROM products;

-- Grant access to the view
GRANT SELECT ON admin_dashboard_stats TO authenticated;
